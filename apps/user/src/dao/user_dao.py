import os
from dataclasses import dataclass
from typing import List

import pymongo

from model.document import Document
from model.user.address import Address
from model.user.device_settings import DeviceSettings
from model.user.permission_group import PermissionGroup


@dataclass
class UserDocument(Document):
    first_name: str
    last_name: str
    bio: str
    name_lower: str
    email: str
    email_confirmed: bool
    phone_number: str
    phone_number_confirmed: bool
    onboarding_completed: bool
    device_id: str
    address: Address
    mailing_address: Address
    device_settings: DeviceSettings
    permission_groups: List[PermissionGroup]
    blocked_users: List[str]
    profile_image: str
    birthday: str
    birthday_month: int
    birthday_day_of_month: int

    # @staticmethod
    # def from_dict(json: Mapping[str, any]):
    #     birthday = json.get("birthday")
    #     birthdate = parse(birthday)
    #     birthday_month = birthdate.month  # 1-indexed
    #     birthday_day = birthdate.day  # 1-indexed
    #
    #     first_name = json.get("firstName")
    #     last_name = json.get("lastName")
    #     name_lower = '_'.join([first_name, last_name]) if first_name is not None and last_name is not None else None
    #
    #     return UserDocument(
    #         _id=json.get("_id"),
    #         first_name=first_name,
    #         last_name=last_name,
    #         bio=json.get("bio"),
    #         name_lower=name_lower,
    #         email=json.get("email"),
    #         email_confirmed=json.get("emailConfirmed"),
    #         phone_number=json.get("phoneNumber"),
    #         phone_number_confirmed=json.get("phoneNumberConfirmed"),
    #         onboarding_completed=json.get("onboardingCompleted"),
    #         device_id=json.get("deviceId"),
    #         address=json.get("address"),
    #         mailing_address=json.get("mailingAddress"),
    #         device_settings=json.get("deviceSettings"),
    #         permission_groups=json.get("permissionGroups"),
    #         blocked_users=json.get("blockedUsers"),
    #         profile_image=json.get("profileImage"),
    #         birthday=birthday,
    #         birthday_month=birthday_month,
    #         birthday_day_of_month=birthday_day,
    #         create_date=json.get("createDate"),
    #         create_by=json.get("createBy"),
    #         update_date=json.get("updateDate"),
    #         update_by=json.get("updateBy")
    #     )


class UserDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection = client.get_database("nevvi").get_collection("users")
