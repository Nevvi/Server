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


class Address(BaseModel):
    street: Optional[str] = Field(...)
    unit: Optional[str] = Field(...)
    city: Optional[str] = Field(...)
    state: Optional[str] = Field(...)
    zip_code: Optional[str] = Field(..., alias="zipCode")


class DeviceSettings(BaseModel):
    auto_sync: bool = Field(..., alias="autoSync")
    notify_out_of_sync: bool = Field(..., alias="notifyOutOfSync")
    notify_birthdays: bool = Field(..., alias="notifyBirthdays")


class PermissionGroup(BaseModel):
    name: str = Field(...)
    fields: List[str] = Field(...)


class UpdateRequest(BaseModel):
    email: Optional[EmailStr] = Field(...)
    first_name: Optional[str] = Field(..., alias="firstName")
    last_name: Optional[str] = Field(..., alias="lastName")
    bio: Optional[str] = Field(...)
    address: Optional[Address] = Field(...)
    mailing_address: Optional[Address] = Field(..., alias="mailingAddress")
    device_settings: Optional[DeviceSettings] = Field(..., alias="deviceSettings")
    permission_groups: Optional[List[PermissionGroup]] = Field(..., alias="permissionGroups")
    birthday: Optional[yyyymmdd]
    onboarding_completed: Optional[bool] = Field(..., alias="onboardingCompleted")
    device_id: Optional[str] = Field(..., alias="deviceId")

    @field_validator('permission_groups')
    def validate_unique_list(cls, permission_groups):
        if permission_groups and len(permission_groups) != len(set([g.name for g in permission_groups])):
            raise ValueError("Permission groups must contain unique names")
        return permission_groups
