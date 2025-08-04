import logging
import os
import requests

logger = logging.getLogger(__name__)


class AuthenticationDao:
    def __init__(self):
        self.base_url = os.environ["AUTHENTICATION_API_URL"]
        self.api_key = os.environ["AUTHENTICATION_API_KEY"]

    def update_user(self, user_id: str, email: str) -> any:
        print(f"Updating user {user_id} with email {email} against the authentication api")
        url = f"{self.base_url}/api/v1/users/{user_id}"
        body = {
            "email": email
        }
        res = requests.patch(url=url, json=body, headers=self._get_headers())
        if res.status_code > 201:
            raise Exception("Failed to update user")

        return res.json()

    def _get_headers(self):
        return {
            'x-api-key': self.api_key
        }
