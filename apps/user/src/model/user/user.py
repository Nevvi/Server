import os
from dataclasses import dataclass
from typing import Optional, List

from typing_extensions import Self

from dao.connection_dao import SearchedConnection
from model.document import UserDocument, SearchedUser
from model.requests import UpdateRequest
from model.user.address import AddressView
from model.user.device_settings import DeviceSettingsView
from model.user.permission_group import PermissionGroupView, DEFAULT_PERMISSION_GROUPS
from model.view import View


@dataclass
class UserView(View):
    id: str
    firstName: str
    lastName: str
    bio: str
    email: str
    emailConfirmed: bool
    phoneNumber: str
    phoneNumberConfirmed: bool
    onboardingCompleted: bool
    deviceId: str
    address: AddressView
    mailingAddress: AddressView
    deviceSettings: DeviceSettingsView
    profileImage: str
    birthday: str
    permissionGroups: List[PermissionGroupView]
    blockedUsers: List[str]
    createDate: str
    updateDate: str

    @staticmethod
    def from_doc(doc: UserDocument):
        address = AddressView.from_doc(doc.get("address") or {})
        mailing_address = AddressView.from_doc(doc.get("mailingAddress") or {})
        device_settings = DeviceSettingsView.from_doc(doc.get("deviceSettings") or {})
        permission_groups = [PermissionGroupView.from_doc(pg) for pg in doc.get("permissionGroups", [])] \
            if "permissionGroups" in doc else DEFAULT_PERMISSION_GROUPS

        return UserView(
            id=doc.get("_id"),
            firstName=doc.get("firstName"),
            lastName=doc.get("lastName"),
            bio=doc.get("bio"),
            email=doc.get("email"),
            emailConfirmed=doc.get("emailConfirmed", False),
            birthday=doc.get("birthday"),
            phoneNumber=doc.get("phoneNumber"),
            phoneNumberConfirmed=doc.get("phoneNumberConfirmed", False),
            onboardingCompleted=doc.get("onboardingCompleted", True),
            deviceId=doc.get("deviceId"),
            address=address,
            mailingAddress=mailing_address,
            deviceSettings=device_settings,
            permissionGroups=permission_groups,
            profileImage=doc.get("profileImage", os.environ["DEFAULT_PROFILE_IMAGE"]),
            blockedUsers=doc.get("blockedUsers", []),
            createDate=doc.get("createDate"),
            updateDate=doc.get("updateDate")
        )

    def update(self, request: UpdateRequest):
        self.firstName = request.first_name if request.first_name else self.firstName
        self.lastName = request.last_name if request.last_name else self.lastName
        self.bio = request.bio if request.bio else self.bio
        self.email = request.email if request.email else self.email
        self.birthday = request.birthday if request.birthday else self.birthday
        self.onboardingCompleted = request.onboarding_completed if request.onboarding_completed else self.onboardingCompleted
        self.deviceId = request.device_id if request.device_id else self.onboardingCompleted
        self.address = AddressView.from_request(request.address) if request.address else self.address
        self.mailingAddress = AddressView.from_request(
            request.mailing_address) if request.mailing_address else self.mailingAddress
        self.deviceSettings = DeviceSettingsView.from_request(
            request.device_settings) if request.device_settings else self.deviceSettings
        self.permissionGroups = [PermissionGroupView.from_request(pg) for pg in
                                 request.permission_groups] if request.permission_groups else self.permissionGroups

    def did_connection_data_change(self, other: Self) -> bool:
        if self.birthday != other.birthday:
            return True

        if (self.phoneNumber and self.phoneNumberConfirmed) != (other.phoneNumber and other.phoneNumberConfirmed):
            return True

        if (self.email and self.emailConfirmed) != (other.email and other.emailConfirmed):
            return True

        if self.address != other.address:
            return True

        if self.mailingAddress != other.mailingAddress:
            return True

        return False

    def add_blocked_user(self, blocked_user_id: str):
        self.blockedUsers.append(blocked_user_id)
        self.blockedUsers = list(set(self.blockedUsers))

    def remove_blocked_user(self, blocked_user_id: str):
        self.blockedUsers = [b for b in self.blockedUsers if b != blocked_user_id]

    def get_permission_group(self, name: str) -> Optional[PermissionGroupView]:
        return next((pg for pg in self.permissionGroups if pg.name == name), None)


@dataclass
class SlimUserView(View):
    id: str
    firstName: str
    lastName: str
    bio: str
    profileImage: str

    connected: Optional[bool] = False
    requested: Optional[bool] = False
    inSync: Optional[bool] = False
    permissionGroup: Optional[str] = None

    @staticmethod
    def from_user(user: UserView):
        return SlimUserView(
            id=user.id,
            firstName=user.firstName,
            lastName=user.lastName,
            bio=user.bio,
            profileImage=user.profileImage
        )

    @staticmethod
    def from_user_doc(doc: UserDocument):
        return SlimUserView(
            id=doc.get("_id"),
            firstName=doc.get("firstName"),
            lastName=doc.get("lastName"),
            bio=doc.get("bio"),
            profileImage=doc.get("profileImage")
        )

    @staticmethod
    def from_searched_user(doc: SearchedUser):
        return SlimUserView(
            id=doc.id,
            firstName=doc.firstName,
            lastName=doc.lastName,
            bio=doc.bio,
            profileImage=doc.profileImage,
            connected=doc.connected,
            requested=doc.requested
        )

    @staticmethod
    def from_searched_connection(doc: SearchedConnection):
        return SlimUserView(
            id=doc.id,
            firstName=doc.firstName,
            lastName=doc.lastName,
            bio=doc.bio,
            profileImage=doc.profileImage,
            inSync=doc.inSync
        )