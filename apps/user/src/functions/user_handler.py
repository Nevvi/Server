import asyncio
import base64
import json
import logging
import re

from shared.authorization.handler_utils import create_response, exception_handler
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
        limit=int(query_params.get("limit")) if "limit" in query_params else 25,
        skip=int(query_params.get("skip")) if "skip" in query_params else 0,
    )

    users = asyncio.run(user_service.search_users(user_id=user_id, request=request))
    return create_response(200, users)


@exception_handler
def search_potential_contacts(event, context):
    user_id = event.get("requestContext").get("authorizer").get("userId")
    body = json.loads(event.get('body', '{}'))
    phone_numbers = body.get("phoneNumbers")
    res = asyncio.run(user_service.search_potential_contacts(user_id=user_id, phone_numbers=phone_numbers))
    return create_response(200, res)


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
    path_params = event.get('pathParameters') or {}
    # Validate content type
    content_type = event.get('headers', {}).get('content-type', '')
    if not content_type.startswith('multipart/form-data'):
        return create_response(400, 'Content-Type must be multipart/form-data')

    # Extract boundary
    boundary = extract_boundary(content_type)
    if not boundary:
        return create_response(400, 'No boundary found in content-type')

    # Decode body
    body = decode_body(event)

    # Parse multipart data
    image_file = parse_multipart_image(body, boundary)
    if not image_file:
        return create_response(400, 'No valid image file found in request')

    updated_user = user_service.update_user_image(user_id=path_params.get("userId"), image=image_file)

    return create_response(200, updated_user)


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


def extract_boundary(content_type):
    """Extract boundary from content-type header"""
    for part in content_type.split(';'):
        part = part.strip()
        if part.startswith('boundary='):
            return part.split('=', 1)[1].strip('"')
    return None


def decode_body(event):
    """Decode request body"""
    body = event.get('body', '')
    if event.get('isBase64Encoded', False):
        return base64.b64decode(body)
    return body.encode('utf-8')


def parse_multipart_image(body, boundary):
    """Parse multipart data and extract image file"""
    boundary_bytes = f'--{boundary}'.encode()
    parts = body.split(boundary_bytes)

    for part in parts[1:-1]:  # Skip first empty and last closing boundary
        if not part.strip():
            continue

        # Split headers and data
        if b'\r\n\r\n' not in part:
            continue

        headers_part, data_part = part.split(b'\r\n\r\n', 1)

        # Parse headers
        file_info = parse_part_headers(headers_part.decode('utf-8'))

        # Check if this is an image file
        if (file_info.get('filename') and
                file_info.get('content_type') in ['image/png', 'image/jpeg', 'image/jpg']):
            # Clean up data (remove trailing boundary markers)
            data_part = data_part.rstrip(b'\r\n')

            return {
                'filename': file_info['filename'],
                'content_type': file_info['content_type'],
                'data': data_part,
                'size': len(data_part)
            }

    return None


def parse_part_headers(headers_text):
    """Parse headers from a multipart section"""
    file_info = {}

    for line in headers_text.strip().split('\r\n'):
        if line.startswith('Content-Disposition:'):
            # Extract filename and field name
            if 'filename=' in line:
                filename_match = re.search(r'filename=["\']?([^"\';\r\n]+)["\']?', line)
                if filename_match:
                    file_info['filename'] = filename_match.group(1)

            if 'name=' in line:
                name_match = re.search(r'name=["\']?([^"\';\r\n]+)["\']?', line)
                if name_match:
                    file_info['field_name'] = name_match.group(1)

        elif line.startswith('Content-Type:'):
            file_info['content_type'] = line.split(':', 1)[1].strip()

    return file_info
