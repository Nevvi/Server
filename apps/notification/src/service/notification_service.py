from typing import Optional

from src.dao.device_dao import DeviceDao
from src.dao.notification_dao import NotificationDao
from src.model.errors import DeviceDoesNotExistError
from src.model.device import Device
from src.model.requests import UpdateTokenRequest


class NotificationService:
    def __init__(self):
        self.device_dao = DeviceDao()
        self.notification_dao = NotificationDao()

    def get_device(self, user_id: str) -> Optional[Device]:
        device_document = self.device_dao.get_device(user_id=user_id)
        return Device.from_document(device_document)

    def update_token(self, request: UpdateTokenRequest):
        user_id = str(request.user_id)
        device = self.get_device(user_id=user_id)

        if not device:
            self.device_dao.add_device(user_id=user_id, token=request.token)
        else:
            self.device_dao.update_device_token(user_id=user_id, token=request.token)

    def send_notification(self, user_id: str, title: str, body: str):
        device = self.get_device(user_id=user_id)
        if not device:
            raise DeviceDoesNotExistError()

        self.notification_dao.send_notification(token=device.token, title=title, body=body)
