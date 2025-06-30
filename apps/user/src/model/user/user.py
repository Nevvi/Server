import os
from typing import Dict, Any

from model.constants import DEFAULT_PERMISSION_GROUPS
from model.user.device_settings import DeviceSettings
from model.user.address import Address
from model.user.permission_group import PermissionGroup


class SlimUser:
    def __init__(self, body: Dict[str, Any]):
        self.id = body.get("id")
        self.first_name = body.get("firstName")
        self.last_name = body.get("lastName")
        self.bio = body.get("bio")
        self.profile_image = body.get("profileImage")

        # We reuse this model for connection and user searches which causes some fields that only exist in one scenario or the other
        self.connected = body.get("connected")
        self.requested = body.get("requested")
        self.in_sync = body.get("inSync")
        self.permission_group = body.get("permissionGroup")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "bio": self.bio,
            "profileImage": self.profile_image,
            "connected": self.connected,
            "requested": self.requested,
            "inSync": self.in_sync,
            "permissionGroup": self.permission_group
        }


class User:
    def __init__(self, body: Dict[str, Any]):
        # data fields
        self.id = body.get("id")
        self.first_name = body.get("firstName")
        self.last_name = body.get("lastName")
        self.bio = body.get("bio")
        self.email = body.get("email")
        self.email_confirmed = body.get("emailConfirmed", False)
        self.birthday = body.get("birthday")
        self.phone_number = body.get("phoneNumber")
        self.phone_number_confirmed = body.get("phoneNumberConfirmed", False)
        self.onboarding_completed = body.get("onboardingCompleted", True)
        self.device_id = body.get("deviceId")
        self.address = Address(body.get("address", {}))
        self.mailing_address = Address(body.get("mailingAddress", {}))
        self.device_settings = DeviceSettings(body.get("deviceSettings", {}))
        self.profile_image = body.get("profileImage", os.environ["DEFAULT_PROFILE_IMAGE"])
        self.blocked_users = body.get("blockedUser", [])

        if "permissionGroups" in body:
            self.permission_groups = [PermissionGroup(pg) for pg in body.get("permissionGroups")]
        else:
            self.permission_groups = DEFAULT_PERMISSION_GROUPS

        # audit fields
        self.create_date = body.get("createDate")
        self.create_by = body.get("createBy")
        self.update_date = body.get("updateDate")
        self.update_by = body.get("updateBy")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "bio": self.bio,
            "email": self.email,
            "emailConfirmed": self.email_confirmed,
            "birthday": self.birthday,
            "phoneNumber": self.phone_number,
            "phoneNumberConfirmed": self.phone_number_confirmed,
            "onboardingCompleted": self.onboarding_completed,
            "deviceId": self.device_id,
            "address": self.address.to_dict(),
            "mailingAddress": self.mailing_address.to_dict(),
            "deviceSettings": self.device_settings.to_dict(),
            "profileImage": self.profile_image,
            "blockedUsers": self.blocked_users,
            "permissionGroups": [pg.to_dict() for pg in self.permission_groups],
            "createDate": self.create_date,
            "createBy": self.create_by,
            "updateDate": self.update_date,
            "updateBy": self.update_by
        }
