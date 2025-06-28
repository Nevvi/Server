from dataclasses import dataclass
from typing import Optional

from src.dao.device_dao import DeviceDocument


@dataclass
class Device:
    user_id: str
    token: str
    create_date: str
    create_by: str
    update_date: str
    update_by: str

    @staticmethod
    def from_document(document: Optional[DeviceDocument]):
        if not document:
            return None

        return Device(
            user_id=document.id,
            token=document.token,
            create_date=document.create_date,
            create_by=document.create_by,
            update_date=document.update_date,
            update_by=document.update_by
        )
