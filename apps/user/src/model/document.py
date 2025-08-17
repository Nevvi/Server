from dataclasses import dataclass
from datetime import datetime
from typing import TypedDict, Optional, List

from src.model.enums import RequestStatus


@dataclass
class SearchedUser:
    id: str
    firstName: str
    lastName: str
    bio: str
    phoneNumber: str
    profileImage: str
    connected: bool
    requested: bool


class AddressDocument(TypedDict):
    street: str
    unit: str
    city: str
    state: str
    zipCode: str


class DeviceSettingsDocument(TypedDict):
    autoSync: bool
    notifyOutOfSync: bool
    notifyBirthdays: bool


class PermissionGroupDocument(TypedDict):
    name: str
    fields: List[str]


class UserDocument(TypedDict):
    _id: str
    phoneNumber: str
    phoneNumberConfirmed: bool
    onboardingCompleted: bool
    permissionGroups: List[PermissionGroupDocument]
    blockedUsers: List[str]
    deviceSettings: DeviceSettingsDocument

    firstName: Optional[str]
    lastName: Optional[str]
    bio: Optional[str]
    nameLower: Optional[str]
    email: Optional[str]
    emailConfirmed: Optional[bool]
    deviceId: Optional[str]
    address: Optional[AddressDocument]
    mailingAddress: Optional[AddressDocument]
    profileImage: Optional[str]
    birthday: Optional[str]
    birthdayMonth: Optional[int]
    birthdayDayOfMonth: Optional[int]
    createDate: str
    updateDate: str


class ConnectionDocument(TypedDict):
    userId: str
    connectedUserId: str
    permissionGroupName: str
    inSync: bool
    createDate: str
    updateDate: str


@dataclass
class ConnectionGroupSearch:
    connections: List[SearchedUser]
    count: int


class ConnectionGroupDocument(TypedDict):
    _id: str
    userId: str
    name: str
    connections: List[str]
    createDate: str
    updateDate: str


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


@dataclass
class SuggestedUser:
    id: str
    firstName: str
    lastName: str
    bio: str
    profileImage: str
    blockedUsers: List[str]


class UserInviteDocument(TypedDict):
    _id: str
    invitedPhoneNumber: str
    requesterUserId: str
    requesterPermissionGroupName: str
    createDate: datetime
