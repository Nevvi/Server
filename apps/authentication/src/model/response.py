from typing import Optional

from types_boto3_cognito_idp.type_defs import AuthenticationResultTypeTypeDef, SignUpResponseTypeDef, \
    GetUserAttributeVerificationCodeResponseTypeDef, ForgotPasswordResponseTypeDef


class RegisterResponse:
    id: str
    is_confirmed: bool
    code_delivery_destination: Optional[str]
    code_delivery_medium: Optional[str]
    code_delivery_attribute: Optional[str]

    def __init__(self, res: SignUpResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        self.id = res.get("UserSub")
        self.is_confirmed = res.get("UserConfirmed")
        self.code_delivery_destination = code_delivery_details.get("Destination")
        self.code_delivery_medium = code_delivery_details.get("DeliveryMedium")
        self.code_delivery_attribute = code_delivery_details.get("AttributeName")

    def to_dict(self):
        return {
            "id": self.id,
            "isConfirmed": self.is_confirmed,
            "codeDeliveryDestination": self.code_delivery_destination,
            "codeDeliveryMedium": self.code_delivery_medium,
            "codeDeliveryAttribute": self.code_delivery_attribute
        }


class LoginResponse:
    id: str
    access_token: str
    id_token: str
    refresh_token: str

    def __init__(self, id: str, auth: AuthenticationResultTypeTypeDef):
        self.id = id
        self.access_token = auth.get("AccessToken")
        self.id_token = auth.get("IdToken")
        self.refresh_token = auth.get("RefreshToken")

    def to_dict(self):
        return {
            "id": self.id,
            "accessToken": self.access_token,
            "idToken": self.id_token,
            "refreshToken": self.refresh_token
        }


class RefreshLoginResponse:
    access_token: str
    id_token: str
    refresh_token: str

    def __init__(self, auth: AuthenticationResultTypeTypeDef):
        self.access_token = auth.get("AccessToken")
        self.id_token = auth.get("IdToken")
        self.refresh_token = auth.get("RefreshToken")

    def to_dict(self):
        return {
            "accessToken": self.access_token,
            "idToken": self.id_token,
            "refreshToken": self.refresh_token
        }


class ForgotPasswordResponse:
    code_delivery_destination: Optional[str]
    code_delivery_medium: Optional[str]
    code_delivery_attribute: Optional[str]

    def __init__(self, res: ForgotPasswordResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        self.code_delivery_destination = code_delivery_details.get("Destination")
        self.code_delivery_medium = code_delivery_details.get("DeliveryMedium")
        self.code_delivery_attribute = code_delivery_details.get("AttributeName")

    def to_dict(self):
        return {
            "codeDeliveryDestination": self.code_delivery_destination,
            "codeDeliveryMedium": self.code_delivery_medium,
            "codeDeliveryAttribute": self.code_delivery_attribute
        }


class SendCodeResponse:
    code_delivery_destination: Optional[str]
    code_delivery_medium: Optional[str]
    code_delivery_attribute: Optional[str]

    def __init__(self, res: GetUserAttributeVerificationCodeResponseTypeDef):
        code_delivery_details = res.get("CodeDeliveryDetails", {})

        self.code_delivery_destination = code_delivery_details.get("Destination")
        self.code_delivery_medium = code_delivery_details.get("DeliveryMedium")
        self.code_delivery_attribute = code_delivery_details.get("AttributeName")

    def to_dict(self):
        return {
            "codeDeliveryDestination": self.code_delivery_destination,
            "codeDeliveryMedium": self.code_delivery_medium,
            "codeDeliveryAttribute": self.code_delivery_attribute
        }



