import json
import logging

from src.functions.handler_utils import create_response, exception_handler
from src.model.errors import UserNotFoundError
from src.model.requests import RegisterRequest, DeleteAccountRequest, UpdateContactRequest, UpdateRequest, SearchRequest
from src.model.user.user import UserView
from src.service.admin_service import AdminService
from src.service.notification_service import NotificationService
from src.service.user_service import UserService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

user_service = UserService()
admin_service = AdminService()
notification_service = NotificationService()


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
    user_id = event.get("requestContext").get("authorizer").get("userId")
    query_params = event.get('queryStringParameters') or {}
    request = SearchRequest(
        name=query_params.get("name"),
        email=query_params.get("email"),
        phoneNumber=query_params.get("phoneNumber"),
        phoneNumbers=query_params.get("phoneNumbers").split(",") if "phoneNumbers" in query_params else None,
        limit=int(query_params.get("limit")) if "limit" in query_params else 25,
        skip=int(query_params.get("skip")) if "skip" in query_params else 0,
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
def get_rejected_users(event, context):
    path_params = event.get('pathParameters') or {}
    requests = user_service.get_blocked_users(user_id=path_params.get("userId"))
    return create_response(200, requests)


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
