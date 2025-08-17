import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import pymongo
from pymongo.errors import DuplicateKeyError
from pymongo.synchronous.collection import Collection

from src.dao.user_dao import SearchedUser
from src.model.document import ConnectionGroupDocument, ConnectionGroupSearch
from src.model.errors import ConnectionGroupExistsError


class ConnectionGroupDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[ConnectionGroupDocument] = client.get_database("nevvi").get_collection(
            "connection_groups")

    def create_group(self, user_id: str, name: str) -> ConnectionGroupDocument:
        now = datetime.now(timezone.utc).isoformat()
        document = ConnectionGroupDocument(
            _id=str(uuid.uuid4()),
            name=name,
            userId=user_id,
            connections=[],
            createDate=now,
            updateDate=now,
        )

        try:
            self.collection.insert_one(document)
        except DuplicateKeyError:
            raise ConnectionGroupExistsError(name)

        return document

    def get_group(self, user_id: str, group_id: str) -> Optional[ConnectionGroupDocument]:
        return self.collection.find_one(filter={
            "userId": user_id,
            "_id": group_id
        })

    def get_groups(self, user_id: str) -> List[ConnectionGroupDocument]:
        return list(self.collection.find(filter={
            "userId": user_id,
        }))

    def delete_group(self, user_id: str, group_id: str) -> bool:
        res = self.collection.delete_one({
            "userId": user_id,
            "_id": group_id
        })

        return res.deleted_count == 1

    def add_user(self, user_id: str, group_id: str, connected_user_id: str) -> bool:
        res = self.collection.update_one(
            filter={"userId": user_id, "_id": group_id},
            update={"$push": {"connections": connected_user_id}}
        )

        return res.modified_count == 1

    def remove_user(self, user_id: str, group_id: str, connected_user_id: str) -> bool:
        res = self.collection.update_one(
            filter={"userId": user_id, "_id": group_id},
            update={"$pull": {"connections": connected_user_id}}
        )

        return res.modified_count == 1

    def get_connections(self, user_id: str, group_id: str, limit: int, skip: int,
                        name: Optional[str] = None) -> ConnectionGroupSearch:
        pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    '_id': group_id,
                }
            },
            {
                '$unwind': {
                    'path': '$connections',
                    'preserveNullAndEmptyArrays': False
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'connections',
                    'foreignField': '_id',
                    'as': 'connectedUser'
                }
            }
        ]

        if name is not None:
            search = '_'.join(name.split(' ')).lower()
            pipeline.append({
                '$match': {
                    'connectedUser.nameLower': {"$regex": search}
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

        res: Dict[str, Any] = self.collection.aggregate(pipeline).next()

        def transform(result: Dict[str, Any]) -> SearchedUser:
            return SearchedUser(
                id=result.get("_id"),
                firstName=result.get("firstName"),
                lastName=result.get("lastName"),
                bio=result.get("bio"),
                profileImage=result.get("profileImage"),
                phoneNumber=result.get("phoneNumber"),
                connected=True,
                requested=True
            )

        connections = [transform(conn.get("connectedUser")[0]) for conn in res.get("connections", []) if
                       len(conn.get("connectedUser", [])) == 1]

        user_count = 0
        if res and len(res.get("connectionCount", [])) == 1:
            user_count = res.get("connectionCount")[0].get("connectionCount", 0)

        return ConnectionGroupSearch(connections, user_count)


if __name__ == '__main__':
    os.environ["MONGO_URI"] = "REPLACEME"
    dao = ConnectionGroupDao()

    # dao.create_group(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", name="Test2")
    # print(dao.get_group(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", group_id="362e154c-36d5-477f-b5a4-da7478caf3d9"))
    # print(dao.get_groups(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c"))
    # dao.add_user(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", group_id="362e154c-36d5-477f-b5a4-da7478caf3d9", connected_user_id="d4d84418-40b1-7042-8efd-7a121430a882")
    # print(dao.get_connections(user_id="74384478-f0c1-7059-097f-2555f8ff7a2c", group_id="362e154c-36d5-477f-b5a4-da7478caf3d9", limit=10, skip=0))
