import os
from typing import Optional, Dict, Any

import boto3
from types_boto3_cognito_idp.client import CognitoIdentityProviderClient
from types_boto3_cognito_idp.type_defs import AdminGetUserResponseTypeDef, GetUserResponseTypeDef, \
    ListUsersResponseTypeDef, UserTypeTypeDef, AdminUpdateUserAttributesRequestTypeDef, ConfirmSignUpResponseTypeDef, \
    SignUpResponseTypeDef, InitiateAuthResponseTypeDef, GetUserAttributeVerificationCodeResponseTypeDef, \
    ResendConfirmationCodeResponseTypeDef, ForgotPasswordResponseTypeDef

from src.util.utils import format_phone_number


class AuthenticationDao:
    def __init__(self):
        self.client: CognitoIdentityProviderClient = boto3.client("cognito-idp")
        self.user_pool_id = os.environ["PUBLIC_USER_POOL_ID"]
        self.user_pool_client_id = os.environ["PUBLIC_USER_POOL_CLIENT_ID"]

    def get_user(self, user_id: str) -> AdminGetUserResponseTypeDef:
        return self.client.admin_get_user(
            UserPoolId=self.user_pool_id,
            Username=user_id
        )

    def get_user_by_token(self, access_token: str) -> GetUserResponseTypeDef:
        return self.client.get_user(AccessToken=access_token)

    def get_user_by_email(self, email: str) -> Optional[UserTypeTypeDef]:
        users: ListUsersResponseTypeDef = self.client.list_users(
            UserPoolId=self.user_pool_id,
            Filter=f"email=\"{email}\""
        )

        return users.get("Users")[0] if len(users.get("Users", [])) == 1 else None

    def get_user_by_phone(self, phone_number: str) -> Optional[UserTypeTypeDef]:
        formatted = format_phone_number(phone_number)
        users: ListUsersResponseTypeDef = self.client.list_users(
            UserPoolId=self.user_pool_id,
            Filter=f"phone_number=\"{formatted}\""
        )

        return users.get("Users")[0] if len(users.get("Users", [])) == 1 else None

    def update_user(self, username: str, email: Optional[str]) -> AdminUpdateUserAttributesRequestTypeDef:
        attributes = []
        if email:
            attributes.append({
                "Name": "email", "Value": email
            })

        return self.client.admin_update_user_attributes(
            UserPoolId=self.user_pool_id,
            Username=username,
            UserAttributes=attributes
        )

    def register(self, username: str, password: str) -> SignUpResponseTypeDef:
        formatted = format_phone_number(username)
        return self.client.sign_up(
            ClientId=self.user_pool_client_id,
            Username=formatted,
            Password=password,
            UserAttributes=[
                {"Name": "phone_number", "Value": formatted}
            ]
        )

    def confirm(self, username: str, confirmation_code: str) -> ConfirmSignUpResponseTypeDef:
        formatted = format_phone_number(username)
        return self.client.confirm_sign_up(
            ClientId=self.user_pool_client_id,
            Username=formatted,
            ConfirmationCode=confirmation_code
        )

    def login(self, username: str, password: str) -> InitiateAuthResponseTypeDef:
        formatted = format_phone_number(username)
        return self.client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            ClientId=self.user_pool_client_id,
            AuthParameters={
                "PASSWORD": password,
                "USERNAME": formatted
            }
        )

    def refresh_login(self, refresh_token: str) -> InitiateAuthResponseTypeDef:
        return self.client.initiate_auth(
            AuthFlow='REFRESH_TOKEN_AUTH',
            ClientId=self.user_pool_client_id,
            AuthParameters={
                "REFRESH_TOKEN": refresh_token
            }
        )

    def logout(self, access_token: str) -> Dict[str, Any]:
        return self.client.global_sign_out(
            AccessToken=access_token
        )

    def send_verification_code(self, access_token: str,
                               attribute_name: str) -> GetUserAttributeVerificationCodeResponseTypeDef:
        return self.client.get_user_attribute_verification_code(
            AccessToken=access_token,
            AttributeName=attribute_name
        )

    def verify_code(self, access_token: str, attribute_name: str, code: str) -> Dict[str, Any]:
        return self.client.verify_user_attribute(
            AccessToken=access_token,
            AttributeName=attribute_name,
            Code=code
        )

    def resend_confirmation_code(self, username: str) -> ResendConfirmationCodeResponseTypeDef:
        formatted = format_phone_number(username)
        return self.client.resend_confirmation_code(
            ClientId=self.user_pool_client_id,
            Username=formatted
        )

    def forgot_password(self, username: str) -> ForgotPasswordResponseTypeDef:
        formatted = format_phone_number(username)
        return self.client.forgot_password(
            ClientId=self.user_pool_client_id,
            Username=formatted
        )

    def confirm_forgot_password(self, username: str, code: str, password: str) -> Dict[str, Any]:
        formatted = format_phone_number(username)
        return self.client.confirm_forgot_password(
            ClientId=self.user_pool_client_id,
            Username=formatted,
            ConfirmationCode=code,
            Password=password
        )
