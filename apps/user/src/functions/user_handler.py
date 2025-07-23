import json
import logging

from pydantic import ValidationError

from model.user.user import UserView
from service.admin_service import AdminService
from service.notification_service import NotificationService
from service.user_service import UserService
from src.model.errors import HttpError, UserNotFoundError
from src.model.requests import RegisterRequest, DeleteAccountRequest, UpdateContactRequest, UpdateRequest, SearchRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

user_service = UserService()
admin_service = AdminService()
notification_service = NotificationService()


def exception_handler(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValidationError as e:
            logger.error(f"Caught validation error: {e}")
            return create_response(400, str(e))
        except HttpError as e:
            logger.error(f"Caught HTTP error: {e}")
            return create_response(e.status_code, e.message)
        except Exception as e:
            logger.error(f"Caught exception handling request: {e}")
            return create_response(500, str(e))

    return wrapper


@exception_handler
def get_user(event, context):
    path_params = event.get('pathParameters') or {}
    user = get_user_by_id(id=path_params.get("userId"))
    return create_response(200, user)


@exception_handler
def create_user(event, context):
    body = json.loads(event.get('body', '{}'))
    user = user_service.create_user(request=RegisterRequest(**body))
    return create_response(200, user)


@exception_handler
def delete_user(event, context):
    path_params = event.get('pathParameters') or {}
    user = admin_service.delete_account(request=DeleteAccountRequest(id=path_params.get("userId")))
    return create_response(200, user)


@exception_handler
def update_user(event, context):
    path_params = event.get('pathParameters') or {}
    existing_user = get_user_by_id(path_params.get("userId"))

    body = json.loads(event.get('body', '{}'))
    request = UpdateRequest(**body)

    updated_user = user_service.update_user(user=existing_user, request=request)
    return create_response(200, updated_user)


@exception_handler
def search_users(event, context):
    user_id = event.requestContext.authorizer.id
    query_params = json.loads(event.get('queryStringParameters', '{}'))
    request = SearchRequest(
        name=query_params.get("name"),
        email=query_params.get("email"),
        phoneNumber=query_params.get("phoneNumber"),
        phoneNumbers=query_params.get("phoneNumbers").split(",") if "phoneNumbers" in query_params else None,
        limit=int(query_params.get("limit")) if "limit" in query_params else None,
        skip=int(query_params.get("skip")) if "skip" in query_params else None,
    )

    users = user_service.search_users(user_id=user_id, request=request)
    return create_response(200, users)


@exception_handler
def update_user_contact(event, context):
    path_params = event.get('pathParameters') or {}
    existing_user = get_user_by_id(path_params.get("userId"))

    body = json.loads(event.get('body', '{}'))
    request = UpdateContactRequest(**body)

    updated_user = user_service.update_user_contact(user=existing_user, request=request)
    return create_response(200, updated_user)


@exception_handler
def update_user_image(event, context):
    # TODO
    pass


@exception_handler
def notify_out_of_sync_users(event, context):
    notified = notification_service.notify_out_of_sync_users()
    return create_response(200, {"users": notified})


@exception_handler
def notify_birthdays(event, context):
    notified = notification_service.notify_birthdays()
    return create_response(200, {"users": notified})


def get_user_by_id(id: str) -> UserView:
    user = user_service.get_user(user_id=id)

    if not user:
        raise UserNotFoundError(id)

    return user


def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'body': json.dumps(body)
    }
