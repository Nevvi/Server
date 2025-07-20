import json
import os
import random
import string
import time
import uuid
from datetime import datetime, timezone

import boto3
import pytest
import requests
from botocore.exceptions import ClientError
from pymongo import MongoClient
from pymongo.errors import CollectionInvalid

from model.connection.connection import ConnectionView
from model.connection.connection_request import ConnectionRequestView
from model.user.address import AddressView
from model.user.device_settings import DeviceSettingsView
from model.user.user import UserView
from service.admin_service import AdminService
from service.connection_service import ConnectionService
from service.export_service import ExportService
from service.notification_service import NotificationService
from service.suggestion_service import SuggestionService
from service.user_service import UserService


def generate_random_string(length):
    """Generates a random string of a given length, composed of letters and digits."""
    characters = string.ascii_letters + string.digits  # All uppercase and lowercase letters, plus digits
    return ''.join(random.choice(characters) for i in range(length))


class IntegrationTest:
    @pytest.fixture(autouse=True)
    def test_wrapper(self):
        self.aws_url = "http://localhost:4566"
        self.wiremock_url = "http://localhost:8080"

        # AWS clients
        self.sqs_client = boto3.client(
            'sqs',
            endpoint_url=self.aws_url,
            region_name='us-east-1',
            aws_access_key_id='test',
            aws_secret_access_key='test'
        )

        self.notification_queue = self._setup_sqs_queue("notifications")
        self.suggestions_queue = self._setup_sqs_queue("suggestions")

        os.environ["AWS_ACCESS_KEY_ID"] = "test"
        os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
        os.environ["AWS_ENDPOINT_URL"] = self.aws_url
        os.environ["MONGO_URI"] = "mongodb://testuser:testpass@localhost:27017/testdb?authSource=admin"
        os.environ["AUTHENTICATION_API_URL"] = f"{self.wiremock_url}/authentication"
        os.environ["AUTHENTICATION_API_KEY"] = "test-key"
        os.environ["NOTIFICATION_QUEUE_URL"] = self.notification_queue
        os.environ["REFRESH_SUGGESTIONS_QUEUE_URL"] = self.suggestions_queue
        os.environ["EMAIL_FROM_ARN"] = "test-email-arn"
        os.environ["IMAGE_BUCKET"] = "user-images"
        os.environ["DEFAULT_PROFILE_IMAGE"] = "default-image"
        os.environ["ADMIN_EMAIL"] = "admin.email@nevvi.net"

        self.mongo_client = MongoClient(os.environ["MONGO_URI"])
        self.mongo_db = self.mongo_client.get_database("nevvi")

        self.user_service = UserService()
        self.connection_service = ConnectionService()
        self.export_service = ExportService()
        self.notification_service = NotificationService()
        self.suggestion_service = SuggestionService()
        self.admin_service = AdminService()

        # Create and/pr cleanup resources
        self._cleanup_resources()
        self._create_resources()

        yield

        # Cleanup after test
        self._cleanup_resources()

    def _create_resources(self):
        try:
            self.mongo_db.create_collection("users")
            self.mongo_db.create_collection("connections")
            self.mongo_db.create_collection("connection_groups")
            self.mongo_db.create_collection("connection_requests")
            self.mongo_db.create_collection("connection_suggestions")
        except CollectionInvalid:
            pass

        self.user = self.create_user()

    def _setup_sqs_queue(self, queue: str):
        try:
            # Create main queue with DLQ
            queue_response = self.sqs_client.create_queue(
                QueueName=queue,
                Attributes={
                    'MessageRetentionPeriod': '86400',
                }
            )
            return queue_response['QueueUrl']

        except ClientError as e:
            if e.response['Error']['Code'] != 'QueueAlreadyExists':
                raise

    def _clear_wiremock_stubs(self):
        """Clear all WireMock stubs"""
        try:
            requests.delete(f"{self.wiremock_url}/__admin/mappings")
        except requests.exceptions.RequestException:
            pass

    def _clear_all_mongo_collections(self):
        """Clear all collections in the test database"""
        # Get all collection names
        collection_names = self.mongo_db.list_collection_names()

        # Skip system collections
        system_collections = ['system.indexes', 'system.users']

        for collection_name in collection_names:
            if collection_name not in system_collections:
                self.mongo_db[collection_name].delete_many({})

    def _cleanup_resources(self):
        """Clean up test resources"""
        # Clear SQS queues
        try:
            self.sqs_client.purge_queue(QueueUrl=self.notification_queue)
            self.sqs_client.purge_queue(QueueUrl=self.suggestions_queue)
        except ClientError:
            pass

        # Clear MongoDB collections
        self._clear_all_mongo_collections()

        # Clear WireMock stubs
        self._clear_wiremock_stubs()

    # Helper methods for testing

    def assert_sqs_message_sent(self, expected_body, queue_url, timeout=5):
        start_time = time.time()
        while time.time() - start_time < timeout:
            messages = self.sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=1
            ).get("Messages", [])
            for message in messages:
                body = message['Body']
                try:
                    # Try to parse as JSON
                    parsed_body = json.loads(body)
                    if parsed_body == expected_body:
                        return True
                except json.JSONDecodeError:
                    # Compare as string
                    if body == expected_body:
                        return True
            time.sleep(0.1)

        raise AssertionError(f"Expected message not found in SQS queue: {expected_body}")

    def setup_wiremock_stub(self, method, url_pattern, response_body, status_code=200, headers=None):
        """Setup a WireMock stub for external API calls"""
        stub_data = {
            "request": {
                "method": method.upper(),
                "urlPattern": url_pattern
            },
            "response": {
                "status": status_code,
                "body": json.dumps(response_body) if isinstance(response_body, dict) else response_body,
                "headers": headers or {"Content-Type": "application/json"}
            }
        }

        response = requests.post(f"{self.wiremock_url}/__admin/mappings", json=stub_data)
        response.raise_for_status()
        return response.json()

    def assert_wiremock_called(self, method, url_pattern, times=None):
        """Assert that WireMock received a specific call"""
        find_request = {
            "method": method.upper(),
            "urlPattern": url_pattern
        }

        response = requests.post(f"{self.wiremock_url}/__admin/requests/find", json=find_request)
        response.raise_for_status()

        requests_found = response.json().get('requests', [])
        actual_count = len(requests_found)

        if times is not None:
            assert actual_count == times, f"Expected {times} calls, but found {actual_count}"
        else:
            assert actual_count > 0, f"Expected at least 1 call, but found {actual_count}"

    def create_user(self, first_name: str = None, last_name: str = None, phone: str = None,
                    blocked_users: list = None) -> UserView:
        address = AddressView(street=generate_random_string(12),
                              city=generate_random_string(8),
                              state=generate_random_string(2),
                              zipCode=generate_random_string(5),
                              unit="")

        blocked_users = blocked_users if blocked_users else []

        first_name = first_name if first_name else generate_random_string(12)
        last_name = last_name if last_name else generate_random_string(12)
        email = f"{first_name}.{last_name}@nevvi.net"

        now = datetime.now(timezone.utc).isoformat()
        user = UserView(
            id=str(uuid.uuid4()),
            firstName=first_name,
            lastName=last_name,
            bio=generate_random_string(40),
            email=email,
            emailConfirmed=False,
            phoneNumber=phone if phone else generate_random_string(10),
            phoneNumberConfirmed=True,  # if we are creating a user then assume phone number was confirmed
            onboardingCompleted=False,
            deviceId=str(uuid.uuid4()),
            address=address,
            mailingAddress=address,
            deviceSettings=DeviceSettingsView(autoSync=True, notifyOutOfSync=True, notifyBirthdays=True),
            permissionGroups=[],
            blockedUsers=blocked_users,
            profileImage="user-image",
            birthday="2000-01-01",
            createDate=now,
            updateDate=now
        )

        user_doc = self.user_service.user_dao.update_user(user=user, upsert=True)
        return UserView.from_doc(user_doc)

    def create_connection(self, user_id: str, connected_user_id: str) -> ConnectionView:
        connection = self.connection_service.connection_dao.create_connection(user_id=user_id,
                                                                              connected_user_id=connected_user_id,
                                                                              permission_group_name="ALL")

        return ConnectionView.from_doc(connection)

    def create_connection_request(self, user: UserView, connected_user_id: str) -> ConnectionRequestView:
        doc = self.connection_service.connection_request_dao.create_connection_request(requesting_user=user,
                                                                                       requested_user_id=connected_user_id,
                                                                                       permission_group_name="ALL")
        return ConnectionRequestView.from_doc(doc)
