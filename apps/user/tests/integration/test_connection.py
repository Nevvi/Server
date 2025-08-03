import asyncio

from integration.integration_test import IntegrationTest
from model.connection.connection_group import ConnectionGroupView
from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME, DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME
from model.enums import RequestStatus
from model.requests import RequestConnectionRequest, ConfirmConnectionRequest, SearchConnectionsRequest, \
    DenyConnectionRequest, UpdateConnectionRequest, BlockConnectionRequest, CreateGroupRequest, \
    AddConnectionToGroupRequest, RemoveConnectionFromGroupRequest


class TestConnectionIntegration(IntegrationTest):

    def test_request_connection(self):
        test_user = self.create_user()

        pending_requests = self.connection_service.get_pending_requests(user_id=test_user.id)
        assert len(pending_requests) == 0

        request = RequestConnectionRequest(requestingUserId=self.user.id,
                                           otherUserId=test_user.id,
                                           permissionGroupName=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        res = self.connection_service.request_connection(request=request)
        assert res.status == RequestStatus.PENDING

        pending_requests = self.connection_service.get_pending_requests(user_id=test_user.id)
        assert len(pending_requests) == 1

        expected_notification = {
            "userId": test_user.id,
            "title": "Nevvi",
            "body": f"{self.user.firstName} would like to connect!"
        }
        assert self.assert_sqs_message_sent(expected_body=expected_notification, queue_url=self.notification_queue)

        expected_message = {
            "userId": self.user.id,
        }
        assert self.assert_sqs_message_sent(expected_body=expected_message, queue_url=self.suggestions_queue)

    def test_confirm_connection(self):
        test_user = self.create_user()
        self.create_connection_request(user=self.user, connected_user_id=test_user.id)

        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 0
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 0

        request = ConfirmConnectionRequest(otherUserId=self.user.id,
                                           requestedUserId=test_user.id,
                                           permissionGroupName=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.connection_service.confirm_connection(request=request)

        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 1
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 1

        expected_notification = {
            "userId": self.user.id,
            "title": "Nevvi",
            "body": f"{test_user.firstName} accepted your request!"
        }
        assert self.assert_sqs_message_sent(expected_body=expected_notification, queue_url=self.notification_queue)

        expected_message = {
            "userId": self.user.id,
        }
        assert self.assert_sqs_message_sent(expected_body=expected_message, queue_url=self.suggestions_queue)

    def test_deny_connection(self):
        test_user = self.create_user()
        self.create_connection_request(user=test_user, connected_user_id=self.user.id)

        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 0
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 0
        assert len(self.connection_service.get_pending_requests(user_id=self.user.id)) == 1

        request = DenyConnectionRequest(userId=self.user.id, otherUserId=test_user.id)
        self.connection_service.deny_connection(request=request)

        # No connections made, no notification sent
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 0
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 0
        assert len(self.connection_service.get_pending_requests(user_id=self.user.id)) == 0
        self.assert_no_sqs_messages_sent(queue_url=self.notification_queue)

        expected_message = {
            "userId": self.user.id,
        }
        assert self.assert_sqs_message_sent(expected_body=expected_message, queue_url=self.suggestions_queue)

    def test_get_user_connection(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()

        # We can see all the info for user one, but only contact info for user two
        self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=test_user_two.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_two.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)

        user_one_connection = self.connection_service.get_user_connection(user_id=self.user.id,
                                                                          other_user_id=test_user_one.id)
        user_two_connection = self.connection_service.get_user_connection(user_id=self.user.id,
                                                                          other_user_id=test_user_two.id)

        assert user_one_connection.email is not None
        assert user_one_connection.phoneNumber is not None
        assert user_one_connection.address is not None
        assert user_one_connection.mailingAddress is not None
        assert user_one_connection.birthday is not None

        # Make sure we can only see user two's contact info (email and phone)
        assert user_two_connection.email is not None
        assert user_two_connection.phoneNumber is not None
        assert user_two_connection.address is None
        assert user_two_connection.mailingAddress is None
        assert user_two_connection.birthday is None

    def test_update_connection(self):
        test_user = self.create_user()

        self.create_connection(user_id=test_user.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)

        test_user_connection = self.connection_service.get_user_connection(user_id=test_user.id,
                                                                           other_user_id=self.user.id)

        # Test user used to be able to see all of our info
        assert test_user_connection.email is not None
        assert test_user_connection.phoneNumber is not None
        assert test_user_connection.address is not None
        assert test_user_connection.mailingAddress is not None
        assert test_user_connection.birthday is not None

        update_request = UpdateConnectionRequest(userId=self.user.id, otherUserId=test_user.id,
                                                 permissionGroupName=DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME)
        self.connection_service.update_connection(request=update_request)

        # Now test user can only see our contact info
        test_user_connection = self.connection_service.get_user_connection(user_id=test_user.id,
                                                                           other_user_id=self.user.id)

        assert test_user_connection.email is not None
        assert test_user_connection.phoneNumber is not None
        assert test_user_connection.address is None
        assert test_user_connection.mailingAddress is None
        assert test_user_connection.birthday is None

    def test_block_connection(self):
        test_user = self.create_user()
        self.create_connection_request(user=self.user, connected_user_id=test_user.id)
        self.create_connection_request(user=test_user, connected_user_id=self.user.id)
        self.create_connection(user_id=test_user.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)

        assert len(self.user.blockedUsers) == 0
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 1
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 1

        request = BlockConnectionRequest(userId=self.user.id, otherUserId=test_user.id)
        self.connection_service.block_connection(request=request)

        # Connections removed, user updated
        updated_user = self.user_service.get_user(user_id=self.user.id)
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=self.user.id)).count == 0
        assert self.connection_service.get_connections(SearchConnectionsRequest(userId=test_user.id)).count == 0
        assert len(self.user.blockedUsers) == 0
        assert test_user.id in updated_user.blockedUsers

    def test_create_group(self):
        request = CreateGroupRequest(name="test", userId=self.user.id)

        assert len(self.connection_service.get_connection_groups(user_id=self.user.id)) == 0

        new_group = self.connection_service.create_group(request=request)

        assert new_group.name == "test"
        assert len(new_group.connections) == 0
        assert len(self.connection_service.get_connection_groups(user_id=self.user.id)) == 1

    def test_delete_group(self):
        new_group = self.create_connection_group(user_id=self.user.id)
        assert len(self.connection_service.get_connection_groups(user_id=self.user.id)) == 1

        self.connection_service.delete_connection_group(user_id=self.user.id, group_id=new_group.id)

        assert len(self.connection_service.get_connection_groups(user_id=self.user.id)) == 0

    def test_add_and_remove_from_connection_group(self):
        new_group = self.create_connection_group(user_id=self.user.id)
        assert len(new_group.connections) == 0

        test_user = self.create_user()
        self.create_connection(user_id=self.user.id, connected_user_id=test_user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=test_user.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)

        request = AddConnectionToGroupRequest(userId=self.user.id, connectedUserId=test_user.id, groupId=new_group.id)
        self.connection_service.add_connection_to_group(request=request)

        def get_group() -> ConnectionGroupView:
            updated_groups = self.connection_service.get_connection_groups(user_id=self.user.id)
            updated_group = next((g for g in updated_groups if g.name == new_group.name), None)
            assert updated_group is not None
            return updated_group

        test_group = get_group()
        assert len(test_group.connections) == 1
        assert test_user.id in test_group.connections

        request = RemoveConnectionFromGroupRequest(userId=self.user.id, connectedUserId=test_user.id, groupId=new_group.id)
        self.connection_service.remove_connection_from_group(request=request)

        test_group = get_group()
        assert len(test_group.connections) == 0

    def test_export_group(self):
        test_user = self.create_user()
        self.create_connection(user_id=self.user.id, connected_user_id=test_user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.create_connection(user_id=test_user.id, connected_user_id=self.user.id,
                               permission_group=DEFAULT_ALL_PERMISSION_GROUP_NAME)

        new_group = self.create_connection_group(user_id=self.user.id)
        self.add_user_to_group(user_id=self.user.id, connected_user_id=test_user.id, group_id=new_group.id)

        # We can't assert the email that was actually sent, but can assume without an exception that something happened
        asyncio.run(self.connection_service.export_group(user_id=self.user.id, group_id=new_group.id))
