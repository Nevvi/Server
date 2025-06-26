import json
import logging
import os

from pydantic import ValidationError

from src.model.errors import HttpError
from src.model.requests import LoginRequest, RegisterRequest, ConfirmSignupRequest, RefreshLoginRequest, LogoutRequest, \
    ResendSignupCodeRequest, ForgotPasswordRequest, ResetPasswordRequest, SendCodeRequest, ConfirmCodeRequest, \
    UpdateRequest
from src.service.authentication_service import AuthenticationService
from src.service.user_service import UserService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_service = AuthenticationService()
user_service = UserService()


def exception_handler(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValidationError as e:
            logger.error(f"Caught validation error: {e}")
            return create_response(400, {'error': str(e)})
        except HttpError as e:
            logger.error(f"Caught HTTP error: {e}")
            return create_response(e.status_code, {'error': e.message})
        except Exception as e:
            logger.error(f"Caught exception handling request: {e}")
            return create_response(500, {'error': 'Internal server error'})

    return wrapper


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
    return create_response(200, response.to_dict())


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
    return create_response(200, response.to_dict())


@exception_handler
def refresh_login(event, context):
    headers = event.get('headers', {})
    refresh_token = headers.get("RefreshToken")
    request = RefreshLoginRequest(refresh_token=refresh_token)
    response = auth_service.refresh_login(request=request)
    return create_response(200, response.to_dict())


@exception_handler
def logout(event, context):
    headers = event.get('headers', {})
    access_token = headers.get("AccessToken")
    request = LogoutRequest(access_token=access_token)
    auth_service.logout(request=request)
    return create_response(200, {})


@exception_handler
def confirm(event, context):
    body = json.loads(event.get('body', '{}'))
    request = ConfirmSignupRequest(username=body.get("username"), confirmation_code=body.get("confirmationCode"))
    auth_service.confirm(request=request)

    logger.info(f"User {request.username} confirmed.. calling user auth_service to create record")
    user = auth_service.get_user_by_phone(phone_number=request.username)
    if not user:
        logger.error(f"Failed to find cognito user with phone number {request.username}")
        create_response(500, {})

    logger.info("Creating user profile")
    user_service.create_user(id=user.user_id, phone_number=user.phone_number)
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
    request = SendCodeRequest(access_token=headers.get("AccessToken"), attribute_name=query_params.get("attribute"))
    response = auth_service.send_code(request=request)
    return create_response(200, response.to_dict())


@exception_handler
def confirm_code(event, context):
    query_params = event.get("queryStringParameters", {})
    headers = event.get('headers', {})
    request = ConfirmCodeRequest(access_token=headers.get("AccessToken"),
                                 attribute_name=query_params.get("attribute"),
                                 code=query_params.get("code"))
    auth_service.confirm_code(request=request)
    return create_response(200, {"message": "Success"})


@exception_handler
def update_user(event, context):
    path_params = event.get('pathParameters', {})
    body = json.loads(event.get('body', '{}'))
    request = UpdateRequest(email=body.get("email"))
    updated_user = auth_service.update_user(user_id=path_params.get("userId"), request=request)
    return create_response(200, updated_user)


def create_response(status_code, body, headers=None):
    if headers is None:
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }

    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body) if isinstance(body, (dict, list)) else body
    }
