import asyncio
import json
import logging

from shared.authorization.handler_utils import create_response, exception_handler
from src.model.requests import InviteConnectionRequest
from src.service.invite_service import InviteService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

invite_service = InviteService()


@exception_handler
def invite_user(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = InviteConnectionRequest(requestingUserId=path_params.get("userId"), **body)
    asyncio.run(invite_service.invite_user(request=request))
    return create_response(200, {"message": "Invite sent!"})
