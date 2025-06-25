import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Mapping

import pymongo


@dataclass
class DeviceDocument:
    _id: str
    token: str
    create_date: str
    create_by: str
    update_date: str
    update_by: str

    @staticmethod
    def from_dict(json: Mapping[str, any]):
        return DeviceDocument(
            _id=json.get("_id"),
            token=json.get("token"),
            create_date=json.get("createDate"),
            create_by=json.get("createBy"),
            update_date=json.get("updateDate"),
            update_by=json.get("updateBy")
        )

    def to_dict(self):
        return {
            "_id": self._id,
            "token": self.token,
            "createDate": self.create_date,
            "createBy": self.create_by,
            "updateDate": self.update_date,
            "updateBy": self.update_by
        }

    @property
    def id(self):
        return self._id


class DeviceDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection = client.get_database("nevvi").get_collection("devices")

    def get_device(self, user_id: str) -> Optional[DeviceDocument]:
        res = self.collection.find_one({"_id": user_id})
        if res is None:
            return None

        return DeviceDocument.from_dict(res)

    def add_device(self, user_id: str, token: str):
        now = datetime.now(timezone.utc).isoformat()
        device = DeviceDocument(
            _id=user_id,
            token=token,
            create_date=now,
            create_by='HARDCODED_FOR_NOW',
            update_date=now,
            update_by='HARDCODED_FOR_NOW'
        )
        self.collection.insert_one(device.to_dict())

    def update_device_token(self, user_id: str, token: str) -> bool:
        update_result = self.collection.update_one(
            filter={"_id": user_id},
            update={"$set": {"token": token}}
        )

        return update_result.modified_count == 1
