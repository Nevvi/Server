import asyncio
import uuid

from src.model.requests import RegisterRequest, SearchRequest, UpdateContactRequest, UpdateRequest

from tests.integration.integration_test import IntegrationTest


class TestUserIntegration(IntegrationTest):
    def test_create_user_initializes_fields(self):
        phone_number = "6511234567"
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")
        self.create_invite(user_id=test_user_one.id, phone_number=phone_number)

        user_id = str(uuid.uuid4())
        assert len(self.connection_service.get_pending_requests(user_id=user_id)) == 0

        request = RegisterRequest(id=user_id, phoneNumber=phone_number)
        user = self.user_service.create_user(request=request)

        assert user.id == user_id
        assert user.phoneNumber == phone_number
        assert user.phoneNumberConfirmed
        assert not user.onboardingCompleted

        pending_requests = self.connection_service.get_pending_requests(user_id=user_id)
        assert len(pending_requests) == 1
        assert pending_requests[0].requestingUserId == test_user_one.id
        assert pending_requests[0].requestedUserId == user_id

        new_user = self.user_service.get_user(user_id=user_id)
        assert user == new_user

    def test_update_user_with_connections(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")

        # Connection initially created as in sync
        connection = self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        assert connection.inSync

        update_request = UpdateRequest(bio="Some bio")
        updated = self.user_service.update_user(user=self.user, request=update_request)
        assert updated.bio == "Some bio"

        # Updating the bio does NOT mark the connection out of sync
        updated_connection = self.get_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        assert updated_connection.inSync

        update_request = UpdateRequest(birthday="1999-01-01")
        updated = self.user_service.update_user(user=self.user, request=update_request)
        assert updated.birthday == "1999-01-01"

        # Updating the birthday marked the connection out of sync
        updated_connection = self.get_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        assert not updated_connection.inSync

    def test_update_user_email_calls_auth_service(self):
        # User initially created with confirmed email
        assert self.user.emailConfirmed

        self.setup_wiremock_stub(method="PATCH",
                                 url=f"/authentication/api/v1/users/{self.user.id}",
                                 response_body={
                                     "emailVerified": False
                                 })

        update_request = UpdateRequest(email="test.email@nevvi.net")
        updated = self.user_service.update_user(user=self.user, request=update_request)

        # Updating the email calls the auth service and sets to unconfirmed
        self.assert_wiremock_called(method="PATCH",
                                    url_pattern=f"/authentication/api/v1/users/{self.user.id}",
                                    times=1)
        assert updated.email == "test.email@nevvi.net"
        assert not updated.emailConfirmed

    def test_searching_users(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe", phone="+16129631237")
        test_user_two = self.create_user(first_name="John", last_name="Doe", phone="+16129631238")

        # Match multiple by name
        request = SearchRequest(name="Doe")
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 2
        assert len(res.users) == 2
        self.assert_user_found(test_user_one, res.users)
        self.assert_user_found(test_user_two, res.users)

        # Match multiple by name (paginated)
        request = SearchRequest(name="Doe", skip=1, limit=1)
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 2
        assert len(res.users) == 1

        # Match single by name
        request = SearchRequest(name="John")
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 1
        assert len(res.users) == 1
        self.assert_user_found(test_user_two, res.users)

        # Match single by email
        request = SearchRequest(email=test_user_one.email)
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 1
        assert len(res.users) == 1
        self.assert_user_found(test_user_one, res.users)

        # Match single by phone
        request = SearchRequest(phoneNumber=test_user_one.phoneNumber)
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 1
        assert len(res.users) == 1
        self.assert_user_found(test_user_one, res.users)

        # Match none
        request = SearchRequest(name="Nomatch")
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 0
        assert len(res.users) == 0

    def test_search_potential_contacts(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe", phone="+16129631237")
        test_user_two = self.create_user(first_name="John", last_name="Doe", phone="+16129631238")

        res = asyncio.run(self.user_service.search_potential_contacts(user_id=self.user.id,
                                                                      phone_numbers=["6129631237",
                                                                                     "6129631238",
                                                                                     "6129631240"]))
        assert len(res.matching) == 2
        assert len(res.missing) == 1
        self.assert_user_found(test_user_one, res.matching)
        self.assert_user_found(test_user_two, res.matching)
        assert "6129631240" in res.missing

    def test_search_connected_user(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")

        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)

        request = SearchRequest(name="Doe")
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 1
        assert len(res.users) == 1
        assert res.users[0].connected

    def test_search_requested_user(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")

        self.create_connection_request(user=self.user, connected_user_id=test_user_one.id)

        request = SearchRequest(name="Doe")
        res = asyncio.run(self.user_service.search_users(user_id=self.user.id, request=request))
        assert res.count == 1
        assert len(res.users) == 1
        assert res.users[0].requested
        assert not res.users[0].connected

    def test_update_user_contact(self):
        new_email = "new.email@nevvi.net"
        request = UpdateContactRequest(email=new_email, emailConfirmed=True)

        res = self.user_service.update_user_contact(user=self.user, request=request)
        assert res.email == new_email
        assert res.emailConfirmed

    def test_update_user_image(self):
        image = self.create_test_image()

        assert image['filename'] not in self.user.profileImage

        updated_user = self.user_service.update_user_image(user_id=self.user.id, image=image)

        assert updated_user.profileImage == f"https://{self.image_bucket}.s3.amazonaws.com/users/{self.user.id}/images/{image['filename']}"

    def test_get_blocked_users(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()
        user = self.create_user(blocked_users=[test_user_one.id, test_user_two.id])

        res = self.user_service.get_blocked_users(user_id=user.id)

        assert len(res) == 2
        self.assert_user_found(test_user_one, res)
        self.assert_user_found(test_user_two, res)
