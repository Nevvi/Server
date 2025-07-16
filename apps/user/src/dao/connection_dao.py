import os
from datetime import datetime, timezone
from typing import TypedDict

import pymongo
from pymongo.errors import DuplicateKeyError
from pymongo.synchronous.collection import Collection

from model.errors import ConnectionExistsError


class ConnectionDocument(TypedDict):
    userId: str
    connectedUserId: str
    permissionGroupName: str
    inSync: bool
    createDate: str
    updateDate: str


class ConnectionDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[ConnectionDocument] = client.get_database("nevvi").get_collection("connections")

    def create_connection(self, user_id: str, connected_user_id: str, permission_group_name: str) -> ConnectionDocument:
        now = datetime.now(timezone.utc).isoformat()
        document = ConnectionDocument(
            userId=user_id,
            connectedUserId=connected_user_id,
            permissionGroupName=permission_group_name,
            inSync=False,
            createDate=now,
            updateDate=now,
        )

        try:
            self.collection.insert_one(document)
        except DuplicateKeyError:
            raise ConnectionExistsError()

        return document


if __name__ == '__main__':
    os.environ["MONGO_URI"] = "REPLACEME"
    dao = ConnectionDao()
    # dao.create_connection(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", connected_user_id="d4d84418-40b1-7042-8efd-7a121430a882", permission_group_name="CONTACT_INFO")