import json
import logging
import os

from src.functions.handler_utils import create_response, exception_handler
from src.model.requests import LoginRequest, RegisterRequest, ConfirmSignupRequest, RefreshLoginRequest, LogoutRequest, \
    ResendSignupCodeRequest, ForgotPasswordRequest, ResetPasswordRequest, SendCodeRequest, ConfirmCodeRequest, \
    UpdateRequest
from src.service.authentication_service import AuthenticationService
from src.service.user_service import UserService

logging.basicConfig(level=logging.INFO)
logging.getLogger().setLevel(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_service = AuthenticationService()
user_service = UserService()


@exception_handler
def get_min_app_versions(event, context):
    return create_response(status_code=200, body={
        "ios": os.environ["MIN_IOS_VERSION"]
    })


@exception_handler
def register(event, context):
    body = json.loads(event.get('body', '{}'))
    request = RegisterRequest(username=body.get("username"), password=body.get("password"))
    response = auth_service.register(request=request)
    logger.info(f"Created new user: {request.username}")
    return create_response(200, response)


@exception_handler
def resend_signup_code(event, context):
    body = json.loads(event.get('body', '{}'))
    request = ResendSignupCodeRequest(username=body.get("username"))
    auth_service.resend_signup_code(request=request)
    return create_response(200, {})


@exception_handler
def login(event, context):
    body = json.loads(event.get('body', '{}'))
    request = LoginRequest(username=body.get("username"), password=body.get("password"))
    response = auth_service.login(request=request)
    logger.info(f"Logged in user: {request.username}")
    return create_response(200, response)


@exception_handler
def refresh_login(event, context):
    headers = event.get('headers', {})
    refresh_token = headers.get("RefreshToken") or headers.get("refreshtoken")
    request = RefreshLoginRequest(refresh_token=refresh_token)
    response = auth_service.refresh_login(request=request)
    return create_response(200, response)


@exception_handler
def logout(event, context):
    headers = event.get('headers', {})
    access_token = headers.get("AccessToken") or headers.get("accesstoken")
    request = LogoutRequest(access_token=access_token)
    auth_service.logout(request=request)
    return create_response(200, {})


@exception_handler
def confirm(event, context):
    body = json.loads(event.get('body', '{}'))
    request = ConfirmSignupRequest(username=body.get("username"), confirmation_code=body.get("confirmationCode"))
    auth_service.confirm(request=request)

    # We need the user id to create the user profile, go back to Cognito to get it
    logger.info(f"User {request.username} confirmed.. calling user auth_service to create record")
    user = auth_service.get_user_by_phone(phone_number=request.username)

    # This should never happen if we were able to successfully confirm the account using the same phone number
    if not user:
        logger.error(f"Failed to find cognito user with phone number {request.username}")
        return create_response(500, {})

    logger.info("Creating user profile")
    user_service.create_user(id=user.userId, phone_number=user.phoneNumber)
    return create_response(200, {})


@exception_handler
def forgot_password(event, context):
    body = json.loads(event.get('body', '{}'))
    request = ForgotPasswordRequest(username=body.get("username"))
    auth_service.forgot_password(request=request)
    return create_response(200, {
        "message": "A verification code has been sent to that number if it exists."
    })


@exception_handler
def confirm_forgot_password(event, context):
    body = json.loads(event.get('body', '{}'))
    request = ResetPasswordRequest(username=body.get("username"), password=body.get("password"), code=body.get("code"))
    auth_service.confirm_forgot_password(request=request)
    return create_response(200, {
        "message": "Password has been reset"
    })


@exception_handler
def send_code(event, context):
    query_params = event.get("queryStringParameters", {})
    headers = event.get('headers', {})
    access_token = headers.get("AccessToken") or headers.get("accesstoken")
    request = SendCodeRequest(access_token=access_token, attribute_name=query_params.get("attribute"))
    response = auth_service.send_code(request=request)
    return create_response(200, response)


@exception_handler
def confirm_code(event, context):
    query_params = event.get("queryStringParameters", {})
    headers = event.get('headers', {})
    access_token = headers.get("AccessToken") or headers.get("accesstoken")
    request = ConfirmCodeRequest(access_token=access_token,
                                 attribute_name=query_params.get("attribute"),
                                 code=query_params.get("code"))
    user_id = auth_service.confirm_code(request=request)
    user_service.confirm_user_email(id=user_id)
    return create_response(200, {"message": "Success"})


@exception_handler
def update_user(event, context):
    path_params = event.get('pathParameters', {})
    body = json.loads(event.get('body', '{}'))
    request = UpdateRequest(email=body.get("email"))
    updated_user = auth_service.update_user(user_id=path_params.get("userId"), request=request)
    return create_response(200, updated_user)
