from dataclasses import dataclass
from typing import Optional, List

from types_boto3_cognito_idp.type_defs import AttributeTypeTypeDef

from src.model.view import View


@dataclass
class User(View):
    userId: str
    phoneNumber: str
    phoneNumberVerified: bool
    email: Optional[str]
    emailVerified: Optional[bool]
    name: Optional[str]

    @staticmethod
    def from_attributes(attributes: List[AttributeTypeTypeDef]):
        user_id: str = next((a for a in attributes if a["Name"] == "sub"))["Value"]
        phone_number: str = next((a for a in attributes if a["Name"] == "phone_number"))["Value"]
        phone_number_verified: bool = bool(
            next((a for a in attributes if a["Name"] == "phone_number_verified"))["Value"])

        email_attribute = next((a for a in attributes if a["Name"] == "email"), None)
        email_verified_attribute = next((a for a in attributes if a["Name"] == "email_verified"), None)
        name_attribute = next((a for a in attributes if a["Name"] == "name"), None)

        return User(
            userId=user_id,
            phoneNumber=phone_number,
            phoneNumberVerified=phone_number_verified,
            email=email_attribute["Value"] if email_attribute is not None else None,
            emailVerified=bool(email_verified_attribute["Value"]) if email_verified_attribute is not None else None,
            name=name_attribute["Value"] if name_attribute is not None else None
        )
