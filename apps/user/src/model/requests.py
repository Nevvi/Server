from datetime import datetime
from typing import Optional, List, Annotated

from pydantic import BaseModel, Field, EmailStr, AfterValidator, field_validator


def val_date(value:str) -> str:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as e:
        raise e
    return value


yyyymmdd = Annotated[str, AfterValidator(val_date)]


class AddressUpdate(BaseModel):
    street: Optional[str] = Field(default=None)
    unit: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    zip_code: Optional[str] = Field(alias="zipCode", default=None)


class DeviceSettingsUpdate(BaseModel):
    auto_sync: bool = Field(alias="autoSync")
    notify_out_of_sync: bool = Field(alias="notifyOutOfSync")
    notify_birthdays: bool = Field(alias="notifyBirthdays")


class PermissionGroupUpdate(BaseModel):
    name: str = Field()
    fields: List[str] = Field()


class UpdateRequest(BaseModel):
    email: Optional[EmailStr] = Field(default=None)
    first_name: Optional[str] = Field(alias="firstName", default=None)
    last_name: Optional[str] = Field(alias="lastName", default=None)
    bio: Optional[str] = Field(default=None)
    address: Optional[AddressUpdate] = Field(default=None)
    mailing_address: Optional[AddressUpdate] = Field(alias="mailingAddress", default=None)
    device_settings: Optional[DeviceSettingsUpdate] = Field(alias="deviceSettings", default=None)
    permission_groups: Optional[List[PermissionGroupUpdate]] = Field(alias="permissionGroups", default=None)
    birthday: Optional[yyyymmdd] = Field(default=None)
    onboarding_completed: Optional[bool] = Field(alias="onboardingCompleted", default=None)
    device_id: Optional[str] = Field(alias="deviceId", default=None)

    @field_validator('permission_groups')
    def validate_unique_list(cls, permission_groups):
        if permission_groups and len(permission_groups) != len(set([g.name for g in permission_groups])):
            raise ValueError("Permission groups must contain unique names")
        return permission_groups


class RegisterRequest(BaseModel):
    id: str = Field()
    phone_number: str = Field(alias="phoneNumber")


class UpdateContactRequest(BaseModel):
    email: Optional[EmailStr] = Field(default=None)
    email_confirmed: Optional[bool] = Field(alias="emailConfirmed", default=None)


class UpdateConnectionRequest(BaseModel):
    user_id: str = Field(alias="userId")
    other_user_id: str = Field(alias="otherUserId")
    permission_group_name: Optional[str] = Field(alias="permissionGroupName", default=None)
    in_sync: Optional[bool] = Field(alias="inSync", default=None)


class SearchRequest(BaseModel):
    name: Optional[str] = Field(min_length=3, default=None)
    email: Optional[EmailStr] = Field(default=None)
    phone_number: Optional[str] = Field(alias="phoneNumber", default=None)
    limit: Optional[int] = Field(default=10, gt=0, le=25)
    skip: Optional[int] = Field(default=0, gte=0)


class SearchGroupsRequest(BaseModel):
    user_id: str = Field(alias="userId")
    name: Optional[str] = Field(default=None)
    limit: Optional[int] = Field(default=25, gt=0, le=500)
    skip: Optional[int] = Field(default=0, gte=0)


class SearchConnectionsRequest(BaseModel):
    user_id: str = Field(alias="userId")
    name: Optional[str] = Field(default=None)
    permission_group: Optional[str] = Field(alias="permissionGroup", default=None)
    in_sync: Optional[bool] = Field(alias="inSync", default=None)
    limit: Optional[int] = Field(default=25, gt=0, le=25)
    skip: Optional[int] = Field(default=0, gte=0)


class RequestConnectionRequest(BaseModel):
    requesting_user_id: str = Field(alias="requestingUserId")
    requested_user_id: str = Field(alias="otherUserId")
    permission_group_name: str = Field(alias="permissionGroupName")


class ConfirmConnectionRequest(BaseModel):
    requesting_user_id: str = Field(alias="otherUserId")
    requested_user_id: str = Field(alias="requestedUserId")
    permission_group_name: str = Field(alias="permissionGroupName")


class AddConnectionToGroupRequest(BaseModel):
    user_id: str = Field(alias="userId")
    group_id: str = Field(alias="groupId")
    connected_user_id: str = Field(alias="connectedUserId")


class RemoveConnectionFromGroupRequest(BaseModel):
    user_id: str = Field(alias="userId")
    group_id: str = Field(alias="groupId")
    connected_user_id: str = Field(alias="connectedUserId")


class DenyConnectionRequest(BaseModel):
    user_id: str = Field(alias="userId")
    other_user_id: str = Field(alias="otherUserId")


class BlockConnectionRequest(BaseModel):
    user_id: str = Field(alias="userId")
    other_user_id: str = Field(alias="otherUserId")


class DeleteAccountRequest(BaseModel):
    id: str = Field()


class CreateGroupRequest(BaseModel):
    user_id: str = Field(alias="userId")
    name: str = Field()


class InviteConnectionRequest(BaseModel):
    requesting_user_id: str = Field(alias="requestingUserId")
    requested_phone_number: str = Field(alias="phoneNumber")
    permission_group_name: str = Field(alias="permissionGroupName")
