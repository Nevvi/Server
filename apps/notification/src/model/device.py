from dataclasses import dataclass
from typing import Optional

from src.dao.device_dao import DeviceDocument


@dataclass
class Device:
    user_id: str
    token: str
    create_date: str
    update_date: str

    @staticmethod
    def from_document(document: Optional[DeviceDocument]):
        if not document:
            return None

        return Device(
            user_id=document.get("_id"),
            token=document.get("token"),
            create_date=document.get("createDate"),
            update_date=document.get("updateDate")
        )
