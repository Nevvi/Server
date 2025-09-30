import logging
import os
import requests

logger = logging.getLogger(__name__)


class UserDao:
    def __init__(self):
        self.base_url = os.environ["USER_API_URL"]
        self.api_key = os.environ["USER_API_KEY"]

    def create_user(self, id: str, phone_number: str):
        logger.info(f"Creating user {id} with phone {phone_number} against the user service")
        url = f"{self.base_url}/api/v1/users"
        body = {
            "id": id,
            "phoneNumber": phone_number
        }
        res = requests.post(url=url, json=body, headers=self._get_headers())
        if res.status_code > 201:
            raise Exception("Failed to create user")

    def confirm_user_email(self, id: str):
        logger.info(f"Confirming email for user {id}")
        url = f"{self.base_url}/api/v1/users/{id}/contact"
        body = {
            "emailConfirmed": True
        }
        res = requests.post(url=url, json=body, headers=self._get_headers())
        if res.status_code > 201:
            raise Exception("Failed to confirm user email")

    def _get_headers(self):
        return {
            'x-api-key': self.api_key
        }
