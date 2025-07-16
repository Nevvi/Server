import os
from datetime import datetime, timezone
from typing import Optional, TypedDict

import pymongo
from pymongo.synchronous.collection import Collection


class DeviceDocument(TypedDict):
    _id: str
    token: str
    createDate: str
    updateDate: str


class DeviceDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[DeviceDocument] = client.get_database("nevvi").get_collection("devices")

    def get_device(self, user_id: str) -> Optional[DeviceDocument]:
        return self.collection.find_one({"_id": user_id})

    def add_device(self, user_id: str, token: str):
        now = datetime.now(timezone.utc).isoformat()
        device = DeviceDocument(
            _id=user_id,
            token=token,
            createDate=now,
            updateDate=now,
        )
        self.collection.insert_one(device)

    def update_device_token(self, user_id: str, token: str) -> bool:
        update_result = self.collection.update_one(
            filter={"_id": user_id},
            update={"$set": {"token": token}}
        )

        return update_result.modified_count == 1
