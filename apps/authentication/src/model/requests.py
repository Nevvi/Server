from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class ConfirmSignupRequest(BaseModel):
    username: str = Field(..., min_length=1)
    confirmation_code: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LogoutRequest(BaseModel):
    access_token: str = Field(..., min_length=1)


class RefreshLoginRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class ResendSignupCodeRequest(BaseModel):
    username: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    username: str = Field(..., min_length=1)


class ResetPasswordRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)


class SendCodeRequest(BaseModel):
    access_token: str = Field(..., min_length=1)
    attribute_name: str = Field(..., min_length=1)


class ConfirmCodeRequest(BaseModel):
    access_token: str = Field(..., min_length=1)
    attribute_name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)


class UpdateRequest(BaseModel):
    email: EmailStr = Field(..., min_length=1)
