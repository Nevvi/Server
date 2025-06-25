from typing import Optional

from src.dao.DeviceDao import DeviceDao
from src.dao.NotificationDao import NotificationDao
from src.error.Errors import DeviceDoesNotExistError
from src.model.Device import Device
from src.model.request.UpdateTokenRequest import UpdateTokenRequest


class NotificationService:
    def __init__(self):
        self.device_dao = DeviceDao()
        self.notification_dao = NotificationDao()

    def get_device(self, user_id: str) -> Optional[Device]:
        device_document = self.device_dao.get_device(user_id=user_id)
        return Device.from_document(device_document)

    def update_token(self, request: UpdateTokenRequest):
        device = self.get_device(user_id=request.user_id)

        if not device:
            self.device_dao.add_device(user_id=request.user_id, token=request.token)
        else:
            self.device_dao.update_device_token(user_id=request.user_id, token=request.token)

    def send_notification(self, user_id: str, title: str, body: str):
        device = self.get_device(user_id=user_id)
        if not device:
            raise DeviceDoesNotExistError()

        self.notification_dao.send_notification(token=device.token, title=title, body=body)