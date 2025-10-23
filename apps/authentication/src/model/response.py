from dataclasses import dataclass
from typing import Optional

from types_boto3_cognito_idp.type_defs import AuthenticationResultTypeTypeDef, SignUpResponseTypeDef, \
    GetUserAttributeVerificationCodeResponseTypeDef, ForgotPasswordResponseTypeDef

from shared.authorization.view import View


@dataclass
class RegisterResponse(View):
    id: str
    isConfirmed: bool
    codeDeliveryDestination: Optional[str]
    codeDeliveryMedium: Optional[str]
    codeDeliveryAttribute: Optional[str]

    @staticmethod
    def from_response(res: SignUpResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        return RegisterResponse(
            id=res.get("UserSub"),
            isConfirmed=res.get("UserConfirmed"),
            codeDeliveryDestination=code_delivery_details.get("Destination"),
            codeDeliveryMedium=code_delivery_details.get("DeliveryMedium"),
            codeDeliveryAttribute=code_delivery_details.get("AttributeName")
        )


@dataclass
class LoginResponse(View):
    id: str
    accessToken: str
    idToken: str
    refreshToken: str

    @staticmethod
    def from_response(id: str, res: AuthenticationResultTypeTypeDef):
        return LoginResponse(
            id=id,
            accessToken=res.get("AccessToken"),
            idToken=res.get("IdToken"),
            refreshToken=res.get("RefreshToken"),
        )


@dataclass
class RefreshLoginResponse(View):
    accessToken: str
    idToken: str
    refreshToken: str

    @staticmethod
    def from_response(res: AuthenticationResultTypeTypeDef):
        return RefreshLoginResponse(
            accessToken=res.get("AccessToken"),
            idToken=res.get("IdToken"),
            refreshToken=res.get("RefreshToken"),
        )


@dataclass
class ForgotPasswordResponse(View):
    codeDeliveryDestination: Optional[str]
    codeDeliveryMedium: Optional[str]
    codeDeliveryAttribute: Optional[str]

    @staticmethod
    def from_response(res: ForgotPasswordResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        return ForgotPasswordResponse(
            codeDeliveryDestination=code_delivery_details.get("Destination"),
            codeDeliveryMedium=code_delivery_details.get("DeliveryMedium"),
            codeDeliveryAttribute=code_delivery_details.get("AttributeName")
        )


@dataclass
class SendCodeResponse(View):
    codeDeliveryDestination: Optional[str]
    codeDeliveryMedium: Optional[str]
    codeDeliveryAttribute: Optional[str]

    @staticmethod
    def from_response(res: GetUserAttributeVerificationCodeResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        return SendCodeResponse(
            codeDeliveryDestination=code_delivery_details.get("Destination"),
            codeDeliveryMedium=code_delivery_details.get("DeliveryMedium"),
            codeDeliveryAttribute=code_delivery_details.get("AttributeName")
        )
