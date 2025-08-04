import logging
from typing import Optional, List

from types_boto3_cognito_idp.type_defs import AttributeTypeTypeDef, GetUserAttributeVerificationCodeResponseTypeDef

from src.dao.authentication_dao import AuthenticationDao
from src.model.errors import InvalidRequestError, UserNotFoundError, UserEmailAlreadyExistsError, \
    PasswordResetRequiredError
from src.model.requests import RegisterRequest, ConfirmSignupRequest, LoginRequest, RefreshLoginRequest, \
    LogoutRequest, ResendSignupCodeRequest, ForgotPasswordRequest, ResetPasswordRequest, SendCodeRequest, \
    ConfirmCodeRequest, UpdateRequest
from src.model.response import LoginResponse, RegisterResponse, RefreshLoginResponse, ForgotPasswordResponse
from src.model.user import User

logger = logging.getLogger(__name__)


def _map_to_user(attributes: List[AttributeTypeTypeDef]) -> User:
    user_id: str = next((a for a in attributes if a["Name"] == "sub"))["Value"]
    phone_number: str = next((a for a in attributes if a["Name"] == "phone_number"))["Value"]
    phone_number_verified: bool = bool(next((a for a in attributes if a["Name"] == "phone_number_verified"))["Value"])

    email_attribute = next((a for a in attributes if a["Name"] == "email"), None)
    email_verified_attribute = next((a for a in attributes if a["Name"] == "email_verified"), None)
    name_attribute = next((a for a in attributes if a["Name"] == "name"), None)

    return User(
        user_id=user_id,
        phone_number=phone_number,
        phone_number_verified=phone_number_verified,
        email=email_attribute["Value"] if email_attribute is not None else None,
        email_verified=bool(email_verified_attribute["Value"]) if email_verified_attribute is not None else None,
        name=name_attribute["Value"] if name_attribute is not None else None
    )


class AuthenticationService:
    def __init__(self):
        self.authentication_dao = AuthenticationDao()

    def get_user(self, user_id: str) -> User:
        res = self.authentication_dao.get_user(user_id=user_id)
        return _map_to_user(res.get("UserAttributes", []))

    def get_user_by_phone(self, phone_number: str) -> Optional[User]:
        res = self.authentication_dao.get_user_by_phone(phone_number=phone_number)
        if not res:
            return None

        return _map_to_user(res.get("Attributes", []))

    def register(self, request: RegisterRequest) -> RegisterResponse:
        res = self.authentication_dao.register(username=request.username, password=request.password)
        return RegisterResponse(res)

    def confirm(self, request: ConfirmSignupRequest):
        self.authentication_dao.confirm(username=request.username, confirmation_code=request.confirmation_code)

    def login(self, request: LoginRequest) -> LoginResponse:
        auth_result = self.authentication_dao.login(username=request.username, password=request.password)
        if not auth_result:
            raise InvalidRequestError("Failed to login")

        if auth_result.get("ChallengeName") == "NEW_PASSWORD_REQUIRED":
            raise PasswordResetRequiredError()

        user = self.authentication_dao.get_user_by_phone(phone_number=request.username)
        if not user:
            print(f"Failed to get user by phone, trying by email instead")
            user = self.authentication_dao.get_user_by_email(email=request.username)

        return LoginResponse(
            id=user.get("Username"),
            auth=auth_result.get("AuthenticationResult")
        )

    def refresh_login(self, request: RefreshLoginRequest) -> RefreshLoginResponse:
        auth_result = self.authentication_dao.refresh_login(refresh_token=request.refresh_token)
        if not auth_result:
            raise InvalidRequestError("Failed to refresh login")

        return RefreshLoginResponse(auth=auth_result.get("AuthenticationResult"))

    def logout(self, request: LogoutRequest):
        self.authentication_dao.logout(access_token=request.access_token)

    def resend_signup_code(self, request: ResendSignupCodeRequest):
        user = self.authentication_dao.get_user_by_phone(phone_number=request.username)
        if not user or user.get("UserStatus") != "UNCONFIRMED":
            print(f"User does not exist or is not unconfirmed")
            return

        self.authentication_dao.resend_confirmation_code(username=request.username)

    def forgot_password(self, request: ForgotPasswordRequest) -> Optional[ForgotPasswordResponse]:
        user = self.authentication_dao.get_user_by_phone(phone_number=request.username)
        if not user:
            return None

        res = self.authentication_dao.forgot_password(username=request.username)
        return ForgotPasswordResponse(res)

    def confirm_forgot_password(self, request: ResetPasswordRequest):
        user = self.authentication_dao.get_user_by_phone(phone_number=request.username)
        if not user:
            raise UserNotFoundError()

        self.authentication_dao.confirm_forgot_password(username=request.username,
                                                        password=request.password,
                                                        code=request.code)

    def send_code(self, request: SendCodeRequest) -> GetUserAttributeVerificationCodeResponseTypeDef:
        return self.authentication_dao.send_verification_code(access_token=request.access_token,
                                                              attribute_name=request.attribute_name)

    def confirm_code(self, request: ConfirmCodeRequest) -> str:
        self.authentication_dao.verify_code(access_token=request.access_token,
                                            attribute_name=request.attribute_name,
                                            code=request.code)
        user = self.authentication_dao.get_user_by_token(access_token=request.access_token)
        return user.get("Username")

    def update_user(self, user_id: str, request: UpdateRequest) -> User:
        # Only one email can exist per user
        if request.email:
            user = self.authentication_dao.get_user_by_email(email=request.email)
            if user and _map_to_user(user.get("Attributes")).user_id != user_id:
                raise UserEmailAlreadyExistsError(request.email)

        self.authentication_dao.update_user(username=user_id, email=request.email)
        return self.get_user(user_id=user_id)
