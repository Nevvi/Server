import os
from dataclasses import dataclass
from typing import Dict, Any, Optional

from dao.user_dao import UserDocument
from model.constants import DEFAULT_PERMISSION_GROUPS
from model.user.device_settings import DeviceSettings
from model.user.address import Address
from model.user.permission_group import PermissionGroup
from model.view import View


@dataclass
class SlimUser(View):
    id: str
    first_name: str
    last_name: str
    bio: str
    profile_image: str

    # We reuse this model for connection and user searches which causes some fields that only exist in one scenario or the other
    connected: bool
    requested: bool
    in_sync: bool
    permission_group: Optional[str]

    @staticmethod
    def from_doc(doc: UserDocument):
        return SlimUser(
            id=doc.id,
            first_name=doc.first_name,
            last_name=doc.last_name,
            bio=doc.bio,
            profile_image=doc.profile_image,
            connected=False,
            requested=False,
            in_sync=False,
            permission_group=None
        )


class User(View):
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
