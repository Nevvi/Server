import json
import logging

from functions.user_handler import exception_handler, create_response
from model.requests import RequestConnectionRequest
from service.connection_service import ConnectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connection_service = ConnectionService()


@exception_handler
def request_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = RequestConnectionRequest(userId=path_params.get("userId"), **body)
    res = connection_service.request_connection(request=request)
    return create_response(200, res)
