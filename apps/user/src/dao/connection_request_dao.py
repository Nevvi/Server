import os
from datetime import datetime, timezone
from typing import List, Optional, TypedDict

import pymongo
from pymongo.errors import DuplicateKeyError
from pymongo.synchronous.collection import Collection

from model.connection.connection_request import RequestStatus
from model.errors import ConnectionRequestExistsError
from model.user.user import User


class ConnectionRequestDocument(TypedDict):
    requestingUserId: str
    requestedUserId: str
    requesterFirstName: str
    requesterLastName: str
    requesterImage: str
    requestingPermissionGroupName: str
    status: RequestStatus
    createDate: str
    updateDate: str


class ConnectionRequestDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[ConnectionRequestDocument] = client.get_database("nevvi").get_collection("connection_requests")

    def get_connection_request(self, requesting_user_id: str, requested_user_id: str) -> Optional[ConnectionRequestDocument]:
        return self.collection.find_one(filter={
            "requestingUserId": requesting_user_id,
            "requestedUserId": requested_user_id,
        })

    def get_connection_requests(self, requested_user_id: str, status: RequestStatus) -> List[ConnectionRequestDocument]:
        return list(self.collection.find(filter={
            "requestedUserId": requested_user_id,
            "status": status
        }))

    def create_connection_request(self, requesting_user: User, requested_user_id: str,
                                  permission_group_name: str) -> ConnectionRequestDocument:
        now = datetime.now(timezone.utc).isoformat()
        document = ConnectionRequestDocument(
            requestingUserId=requesting_user.id,
            requestedUserId=requested_user_id,
            requesterImage=requesting_user.profileImage,
            requesterFirstName=requesting_user.firstName,
            requesterLastName=requesting_user.lastName,
            requestingPermissionGroupName=permission_group_name,
            status=RequestStatus.PENDING,
            createDate=now,
            updateDate=now,
        )

        try:
            self.collection.insert_one(document)
        except DuplicateKeyError:
            raise ConnectionRequestExistsError()

        return document

    def update_connection_request(self, requesting_user_id: str, requested_user_id: str, status: RequestStatus) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        res = self.collection.update_one(
            filter={"requestingUserId": requesting_user_id, "requestedUserId": requested_user_id},
            update={"$set": {"status": status, "updateDate": now}}
        )

        return res.modified_count == 1

    def delete_connection_request(self, requesting_user_id: str, requested_user_id: str) -> bool:
        res = self.collection.delete_one({
            "requestingUserId": requesting_user_id,
            "requestedUserId": requested_user_id
        })

        return res.deleted_count == 1


if __name__ == '__main__':
    os.environ["MONGO_URI"] = "REPLACEME"
    dao = ConnectionRequestDao()
