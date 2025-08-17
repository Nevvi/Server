import os
from typing import List, Dict, Any

import pymongo
from pymongo.synchronous.collection import Collection

from src.model.document import SuggestedUser

MIN_SHARED_CONNECTIONS = 2


class SuggestionsDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.suggestion_collection = client.get_database("nevvi").get_collection("connection_suggestions")
        self.user_collection = client.get_database("nevvi").get_collection("users")

    def find_possible_suggestions(self, user_id: str) -> List[SuggestedUser]:
        pipeline: List[Dict[str, Any]] = [
            {
                "$match": {
                    "_id": user_id,
                },
            },
            {
                "$lookup": {
                    "from": "connections",
                    "localField": "_id",
                    "foreignField": "userId",
                    "as": "connections",
                },
            },
            {
                "$lookup": {
                    "from": "connection_suggestions",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "suggestions",
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "connectionIds": "$connections.connectedUserId",
                    "blockedUsers": 1,
                    "ignoredSuggestions": {
                        "$ifNull": [{"$arrayElemAt": ["$suggestions.ignored", 0]}, []]
                    }
                },
            },
            {
                "$graphLookup": {
                    "from": "connections",
                    "startWith": "$_id",
                    "connectFromField": "connectedUserId",
                    "connectToField": "userId",
                    "as": "connectionHierarchy",
                    "maxDepth": 1,
                },
            },
            {
                "$unwind": {
                    "path": "$connectionHierarchy",
                },
            },
            {
                "$project": {
                    "connectionUserId": "$connectionHierarchy.userId",
                    "suggestedUserId": "$connectionHierarchy.connectedUserId",
                    "connectionIds": 1,
                    "blockedUsers": 1,
                    "ignoredSuggestions": 1
                },
            },
            {
                "$addFields": {
                    "connected": {
                        "$in": [
                            "$suggestedUserId",
                            "$connectionIds",
                        ],
                    },
                    "blocked": {
                        "$in": [
                            "$suggestedUserId",
                            "$blockedUsers",
                        ],
                    },
                    "ignored": {
                        "$in": [
                            "$suggestedUserId",
                            "$ignoredSuggestions",
                        ],
                    }
                },
            },
            {
                "$match": {
                    "$and": [
                        {
                            "connectionUserId": {
                                "$ne": user_id,
                            },
                        },
                        {
                            "suggestedUserId": {
                                "$ne": user_id,
                            },
                        },
                        {
                            "connected": False,
                        },
                        {
                            "blocked": False,
                        },
                        {
                            "ignored": False
                        }
                    ],
                },
            },
            {
                "$group": {
                    "_id": "$suggestedUserId",
                    "count": {
                        "$sum": 1,
                    },
                },
            },
            {
                "$match": {
                    "count": {
                        "$gte": MIN_SHARED_CONNECTIONS
                    }
                }
            },
            {
                "$sort": {
                    "count": -1,
                },
            },
            {
                "$limit": 20,
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "suggestedUser",
                },
            },
        ]

        return self.__execute_and_transform(pipeline, self.user_collection)

    def get_suggestions(self, user_id: str) -> List[SuggestedUser]:
        pipeline: List[Dict[str, Any]] = [
            {
                '$match': {
                    '_id': user_id
                }
            },
            {
                '$lookup': {
                    'from': 'connections',
                    'localField': '_id',
                    'foreignField': 'userId',
                    'as': 'connections'
                }
            },
            {
                '$project': {
                    'suggestions': {
                        '$filter': {
                            'input': '$suggestions',
                            'as': 'suggestion',
                            'cond': {
                                '$not': {
                                    '$in': [
                                        '$$suggestion', '$connections.connectedUserId'
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                '$unwind': {
                    'path': '$suggestions',
                    'preserveNullAndEmptyArrays': False
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'suggestions',
                    'foreignField': '_id',
                    'as': 'suggestedUser'
                }
            }
        ]

        return self.__execute_and_transform(pipeline, self.suggestion_collection)

    def update_suggestions(self, user_id: str, suggestions: List[str]):
        self.suggestion_collection.update_one(
            filter={"_id": user_id},
            update={"$set": {"suggestions": suggestions}},
            upsert=True
        )

    def remove_suggestions(self, user_id: str, suggested_user_id: str) -> bool:
        res = self.suggestion_collection.update_one(
            filter={"_id": user_id},
            update={"$pull": {"suggestions": suggested_user_id}},
        )

        return res.modified_count == 1

    def ignore_suggestions(self, user_id: str, suggested_user_id: str) -> bool:
        res = self.suggestion_collection.update_one(
            filter={"_id": user_id},
            update={
                "$pull": {"suggestions": suggested_user_id},
                "$push": {"ignored": suggested_user_id},
            },
        )

        return res.modified_count == 1

    @staticmethod
    def __execute_and_transform(pipeline: List[Dict[str, Any]], collection: Collection) -> List[SuggestedUser]:
        results = list(collection.aggregate(pipeline))
        suggested_users = [s.get("suggestedUser")[0] for s in results if len(s.get("suggestedUser", [])) == 1]

        def transform(result: Dict[str, Any]) -> SuggestedUser:
            return SuggestedUser(
                id=result.get("_id"),
                firstName=result.get("firstName"),
                lastName=result.get("lastName"),
                bio=result.get("bio"),
                profileImage=result.get("profileImage"),
                blockedUsers=result.get("blockedUsers")
            )

        return list(map(transform, suggested_users))
