import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import pymongo
from pymongo.errors import DuplicateKeyError
from pymongo.synchronous.collection import Collection

from model.document import ConnectionDocument
from model.errors import ConnectionExistsError


@dataclass
class SearchedConnection:
    id: str
    firstName: str
    lastName: str
    bio: str
    profileImage: str
    permissionGroupName: str
    inSync: Optional[bool] = False


@dataclass
class ConnectionSearchResponse:
    connections: List[SearchedConnection]
    count: int


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

    def get_connections(self,
                        user_id: str,
                        skip: int,
                        limit: int,
                        name: Optional[str] = None,
                        permission_group: Optional[str] = None,
                        in_sync: Optional[bool] = None) -> ConnectionSearchResponse:
        pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'inSync': in_sync if in_sync is not None else {'$exists': True}
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'connectedUserId',
                    'foreignField': '_id',
                    'as': 'connectedUser'
                }
            }
        ]

        if name is not None:
            search = '_'.join([part for part in name.split(' ') if len(part)]).lower()
            pipeline.append({
                '$match': {
                    'connectedUser.nameLower': {"$regex": search}
                }
            })

        if permission_group is not None:
            pipeline.append({
                '$match': {
                    'permissionGroupName': permission_group
                }
            })

        pipeline.append({
            '$sort': {
                "connectedUser.lastName": 1,
                "connectedUser.firstName": 1
            }
        })

        pipeline.append({
            '$facet': {
                'connections': [
                    {
                        '$skip': skip
                    },
                    {
                        '$limit': limit
                    }
                ],
                'connectionCount': [
                    {
                        '$count': 'connectionCount'
                    }
                ]
            }
        })

        # { "connections": [...], "connectionCount": { "connectionCount": int }
        res: Dict[str, Any] = self.collection.aggregate(pipeline).next()

        def transform(result: Dict[str, Any]) -> SearchedConnection:
            connection_data = result.get("connectedUser")[0]
            return SearchedConnection(
                id=connection_data.get("_id"),
                firstName=connection_data.get("firstName"),
                lastName=connection_data.get("lastName"),
                bio=connection_data.get("bio"),
                profileImage=connection_data.get("profileImage"),
                permissionGroupName=result.get("permissionGroupName"),
                inSync=result.get("inSync", False),
            )

        connections = [transform(conn) for conn in res.get("connections", []) if
                       len(conn.get("connectedUser", [])) == 1]

        # connectionCount comes back nested
        user_count = 0
        if res is not None and len(res.get("connectionCount", [])) == 1:
            user_count = res.get("connectionCount", [])[0].get("connectionCount", 0)

        return ConnectionSearchResponse(connections=connections, count=user_count)

    def connections_exist_in_permission_group(self, user_id: str, permission_group: str) -> bool:
        connections = self.get_connections(user_id=user_id, permission_group=permission_group, skip=0, limit=1)
        return connections.count > 0

    def get_connection(self, user_id: str, connected_user_id: str) -> Optional[ConnectionDocument]:
        return self.collection.find_one(filter={
            "userId": user_id,
            "connectedUserId": connected_user_id
        })

    def update_connection(self,
                          user_id: str,
                          connected_user_id: str,
                          permission_group: Optional[str] = None,
                          in_sync: Optional[bool] = None) -> bool:
        fields_to_set = {}
        if permission_group is not None:
            fields_to_set["permissionGroupName"] = permission_group
        if in_sync is not None:
            fields_to_set["inSync"] = in_sync

        if not len(fields_to_set):
            print("No fields to update connection... exiting")
            return True

        res = self.collection.update_one(
            filter={"userId": user_id, "connectedUserId": connected_user_id},
            update={"$set": fields_to_set}
        )

        return res.modified_count == 1

    def delete_connection(self, user_id: str, connected_user_id: str) -> bool:
        res = self.collection.delete_one(filter={
            "userId": user_id,
            "connectedUserId": connected_user_id
        })

        return res.deleted_count == 1

    def mark_connections(self, user_id: str) -> int:
        res = self.collection.update_many(
            filter={"connectedUserId": user_id},
            update={"$set": {"inSync": False}}
        )

        return res.modified_count

    def get_users_with_out_of_sync_connections(self, skip: int = 0, limit: int = 500) -> List[str]:
        pipeline = [
            {
                "$match": {
                    "inSync": False
                }
            },
            {
                "$group": {
                    "_id": '$userId',
                    "outOfSync": {
                        "$sum": 1
                    }
                }
            },
            {
                "$lookup": {
                    'from': 'users',
                    'localField': '_id',
                    'foreignField': '_id',
                    'as': 'user'
                }
            },
            {
                "$match": {
                    "$or": [
                        {"user.deviceSettings.notifyOutOfSync": {"$exists": False}},
                        {"user.deviceSettings.notifyOutOfSync": {"$eq": True}}
                    ]
                }
            },
            {
                "$skip": skip
            },
            {
                "$limit": limit
            }
        ]

        res: List[Dict[str, Any]] = list(self.collection.aggregate(pipeline))
        return [doc.get("_id") for doc in res]


if __name__ == '__main__':
    os.environ["MONGO_URI"] = "REPLACEME"
    dao = ConnectionDao()
    # dao.create_connection(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", connected_user_id="d4d84418-40b1-7042-8efd-7a121430a882", permission_group_name="CONTACT_INFO")
