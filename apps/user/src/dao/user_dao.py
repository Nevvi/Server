import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import pymongo
from dateutil.parser import parse
from pymongo.errors import DuplicateKeyError
from pymongo.synchronous.collection import Collection

from src.model.document import UserDocument, DeviceSettingsDocument, SearchedUser, AddressDocument, PermissionGroupDocument
from src.model.errors import UserAlreadyExistsError, UserNotFoundError
from src.model.user.user import UserView


class UserDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[UserDocument] = client.get_database("nevvi").get_collection("users")

    def get_user(self, user_id: str) -> Optional[UserDocument]:
        return self.collection.find_one(filter={"_id": user_id})

    def get_user_by_email(self, email: str) -> Optional[UserDocument]:
        return self.collection.find_one(filter={"email": email})

    def get_user_by_phone(self, phone_number: str) -> Optional[UserDocument]:
        return self.collection.find_one(filter={"phoneNumber": phone_number})

    def create_user(self, user_id: str, phone_number: str) -> UserDocument:
        now = datetime.now(timezone.utc).isoformat()
        doc = UserDocument(
            _id=user_id,
            firstName=None,
            lastName=None,
            bio=None,
            nameLower=None,
            email=None,
            emailConfirmed=False,
            phoneNumber=phone_number,
            phoneNumberConfirmed=True,  # if we are creating a user then assume phone number was confirmed
            onboardingCompleted=False,
            deviceId=None,
            address=None,
            mailingAddress=None,
            deviceSettings=DeviceSettingsDocument(autoSync=True, notifyOutOfSync=True, notifyBirthdays=True),
            permissionGroups=[],
            blockedUsers=[],
            profileImage=None,
            birthday=None,
            birthdayMonth=None,
            birthdayDayOfMonth=None,
            createDate=now,
            updateDate=now
        )

        try:
            self.collection.insert_one(doc)
        except DuplicateKeyError:
            raise UserAlreadyExistsError(user_id)

        return doc

    def update_user(self, user: UserView, upsert: bool = False) -> UserDocument:
        user.updateDate = datetime.now(timezone.utc).isoformat()
        name_lower = f"{user.firstName}_{user.lastName}".lower() if user.firstName and user.lastName else None
        birthdate = parse(user.birthday) if user.birthday else None
        birthday_month = birthdate.month if birthdate else None
        birthday_day = birthdate.day if birthdate else None
        address = AddressDocument(**user.address.__dict__)
        mailing_address = AddressDocument(**user.mailingAddress.__dict__)
        device_settings = DeviceSettingsDocument(**user.deviceSettings.__dict__)
        permission_groups = [PermissionGroupDocument(**pg.__dict__) for pg in user.permissionGroups]

        doc = UserDocument(
            _id=user.id,
            firstName=user.firstName,
            lastName=user.lastName,
            bio=user.bio,
            nameLower=name_lower,
            email=user.email,
            emailConfirmed=user.emailConfirmed,
            phoneNumber=user.phoneNumber,
            phoneNumberConfirmed=user.phoneNumberConfirmed,
            onboardingCompleted=user.onboardingCompleted,
            deviceId=user.deviceId,
            address=address,
            mailingAddress=mailing_address,
            deviceSettings=device_settings,
            permissionGroups=permission_groups,
            blockedUsers=user.blockedUsers,
            profileImage=user.profileImage,
            birthday=user.birthday,
            birthdayMonth=birthday_month,
            birthdayDayOfMonth=birthday_day,
            createDate=user.createDate,
            updateDate=user.updateDate
        )

        res = self.collection.replace_one(filter={"_id": user.id}, replacement=doc, upsert=upsert)
        if not upsert and res.modified_count == 0:
            raise UserNotFoundError(user.id)

        return doc

    def get_users(self, skip: int = 0, limit: int = 1000) -> List[UserDocument]:
        pipeline = [
            {
                '$skip': skip
            },
            {
                '$limit': limit
            },
        ]

        return list(self.collection.aggregate(pipeline))

    def search_users(self, user_id: str, name: Optional[str], phone_numbers: List[str], skip: int, limit: int) -> List[
        SearchedUser]:
        user = self.get_user(user_id=user_id)
        if not user:
            return []

        query = self.__generate_base_query(user=user, name=name, phone_numbers=phone_numbers)

        pipeline = [
            {
                '$match': query
            },
            {
                '$skip': skip
            },
            {
                '$limit': limit
            },
            {
                '$lookup': {
                    'from': 'connections',
                    'let': {
                        'searchedUserId': '$_id'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$connectedUserId', '$$searchedUserId'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$userId', user_id
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'connectedUser'
                }
            },
            {
                '$lookup': {
                    'from': 'connection_requests',
                    'let': {
                        'searchedUserId': '$_id'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$requestedUserId', '$$searchedUserId'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$requestingUserId', user_id
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'requestedUser'
                }
            }
        ]

        results: List[Dict[str, Any]] = list(self.collection.aggregate(pipeline))

        def transform(result: Dict[str, Any]) -> SearchedUser:
            return SearchedUser(
                id=result.get("_id"),
                firstName=result.get("firstName"),
                lastName=result.get("lastName"),
                bio=result.get("bio"),
                profileImage=result.get("profileImage"),
                connected=len(result.get("connectedUser", [])) == 1,
                requested=len(result.get("requestedUser", [])) == 1,
            )

        return list(map(transform, results))

    def search_user_count(self, user_id: str, name: str, phone_numbers: List[str]) -> int:
        user = self.get_user(user_id=user_id)
        if not user:
            return 0

        query = self.__generate_base_query(user=user, name=name, phone_numbers=phone_numbers)
        return self.collection.count_documents(filter=query)

    def get_blocked_users(self, user_id: str) -> List[UserDocument]:
        pipeline: any = [
            {
                '$match': {
                    '_id': user_id
                }
            },
            {
                '$unwind': {
                    'path': '$blockedUsers',
                    'preserveNullAndEmptyArrays': False
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'blockedUsers',
                    'foreignField': '_id',
                    'as': 'blockedUser'
                }
            }
        ]

        res: List[Dict[str, Any]] = list(self.collection.aggregate(pipeline))

        blocked_users = [UserDocument(**u.get("blockedUser")[0]) for u in res if len(u.get("blockedUser")) == 1]

        return blocked_users

    def get_users_by_birthday(self, birthday: datetime) -> List[UserDocument]:
        return list(self.collection.find(filter={
            'birthdayMonth': birthday.month,
            'birthdayDayOfMonth': birthday.day,
        }))

    @staticmethod
    def __generate_base_query(user: UserDocument, name: Optional[str], phone_numbers: List[str]):
        user_id = user.get("_id")
        blocked_users = user.get("blockedUsers", [])
        query = {
            '_id': {'$nin': [user_id, *blocked_users]},  # don't show user themselves or users they blocked
            'blockedUsers': {'$nin': [user.get("_id")]}  # don't show user people that blocked them
        }

        if phone_numbers is not None and len(phone_numbers):
            query["phoneNumber"] = {"$in": phone_numbers}
        elif name and len(name):
            name_search = '_'.join([part for part in name.lower().split(' ') if len(part)])
            query["nameLower"] = {"$regex": name_search}

        return query
