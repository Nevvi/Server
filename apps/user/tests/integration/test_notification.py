import asyncio
from datetime import datetime

from src.model.requests import InviteConnectionRequest
from src.util.phone_number_utils import format_phone_number
from tests.integration.integration_test import IntegrationTest


class TestNotificationIntegration(IntegrationTest):
    def test_notify_birthdays_sends_notifications(self):
        test_user_one = self.create_user(birthday="2000-01-01")
        self.create_connection(user_id=test_user_one.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_one.id)

        test_user_two = self.create_user(birthday=datetime.now().strftime("%Y-%m-%d"))
        self.create_connection(user_id=test_user_two.id, connected_user_id=self.user.id)
        self.create_connection(user_id=self.user.id, connected_user_id=test_user_two.id)

        asyncio.run(self.notification_service.notify_birthdays())

        expected_message = {
            "userId": self.user.id,
            "title": f"It's ${test_user_two.firstName} ${test_user_two.lastName}'s birthday!",
            "body": f"Wish them a happy birthday"
        }

        assert self.assert_sqs_message_sent(expected_body=expected_message, queue_url=self.notification_queue)
