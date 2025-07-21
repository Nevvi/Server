import uuid

from integration.integration_test import IntegrationTest
from model.requests import RegisterRequest, SearchRequest, UpdateContactRequest
from model.user.user import SlimUserView


class TestUserIntegration(IntegrationTest):
    def test_create_user_initializes_fields(self):
        user_id = str(uuid.uuid4())
        request = RegisterRequest(id=user_id, phoneNumber="6511234567")
        user = self.user_service.create_user(request=request)

        assert user.id == user_id
        assert user.phoneNumber == "6511234567"
        assert user.phoneNumberConfirmed
        assert not user.onboardingCompleted

        new_user = self.user_service.get_user(user_id=user_id)
        assert user == new_user

    def test_update_user_with_connections(self):
        # TODO
        pass

    def test_searching_users(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")
        test_user_two = self.create_user(first_name="John", last_name="Doe")

        # Match multiple by name
        request = SearchRequest(name="Doe")
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 2
        assert len(res.users) == 2
        assert SlimUserView.from_user(test_user_one) in res.users
        assert SlimUserView.from_user(test_user_two) in res.users

        # Match multiple by name (paginated)
        request = SearchRequest(name="Doe", skip=1, limit=1)
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 2
        assert len(res.users) == 1

        # Match single by name
        request = SearchRequest(name="John")
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 1
        assert len(res.users) == 1
        assert SlimUserView.from_user(test_user_two) in res.users

        # Match single by email
        request = SearchRequest(email=test_user_one.email)
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 1
        assert len(res.users) == 1
        assert SlimUserView.from_user(test_user_one) in res.users

        # Match single by phone
        request = SearchRequest(phoneNumber=test_user_one.phoneNumber)
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 1
        assert len(res.users) == 1
        assert SlimUserView.from_user(test_user_one) in res.users

        # Match none
        request = SearchRequest(name="Nomatch")
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 0
        assert len(res.users) == 0

    def test_search_connected_user(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")

        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)

        request = SearchRequest(name="Doe")
        res = self.user_service.search_users(user_id=self.user.id, request=request)
        assert res.count == 1
        assert len(res.users) == 1
        assert res.users[0].connected

    def test_search_requested_user(self):
        test_user_one = self.create_user(first_name="Jane", last_name="Doe")

        self.create_connection_request(user=self.user, connected_user_id=test_user_one.id)

        request = SearchRequest(name="Doe")
        res = self.user_service.search_users(user_id=self.user.id, request=request)
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
        image_name = "test_image_name.png"
        content_type = "image/png"

        assert image_name not in self.user.profileImage

        updated_user = self.user_service.update_user_image(user_id=self.user.id, image=image, image_name=image_name,
                                                           content_type=content_type)

        assert updated_user.profileImage == f"https://{self.image_bucket}.s3.amazonaws.com/users/{self.user.id}/images/{image_name}"

    def test_get_blocked_users(self):
        test_user_one = self.create_user()
        test_user_two = self.create_user()
        user = self.create_user(blocked_users=[test_user_one.id, test_user_two.id])

        res = self.user_service.get_blocked_users(user_id=user.id)

        assert len(res) == 2
        assert SlimUserView.from_user(test_user_one) in res
        assert SlimUserView.from_user(test_user_two) in res
