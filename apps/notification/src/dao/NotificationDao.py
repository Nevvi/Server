import base64
from typing import Optional

import firebase_admin
import json
import os

from firebase_admin import credentials, messaging


class NotificationDao:
    def __init__(self):
        firebase_credentials_json = json.loads(base64.b64decode(os.environ["FIREBASE_CREDENTIALS"]))
        certificate = credentials.Certificate(firebase_credentials_json)
        firebase_admin.initialize_app(certificate)

    def send_notification(self, token: str, title: str, body: str) -> Optional[str]:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=token,
        )

        try:
            response = messaging.send(message)
            print(f'Successfully sent message: {response}')
            return response
        except Exception as e:
            print(f'Error sending message: {e}')
            return None
