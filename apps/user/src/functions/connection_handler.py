import json
import logging

from src.functions.handler_utils import create_response, exception_handler
from src.model.requests import RequestConnectionRequest, ConfirmConnectionRequest, DenyConnectionRequest, \
    SearchConnectionsRequest, UpdateConnectionRequest, BlockConnectionRequest
from src.service.connection_service import ConnectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connection_service = ConnectionService()


@exception_handler
def request_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = RequestConnectionRequest(requestingUserId=path_params.get("userId"), **body)
    res = connection_service.request_connection(request=request)
    return create_response(200, res)


@exception_handler
def confirm_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = ConfirmConnectionRequest(requestedUserId=path_params.get("userId"), **body)
    res = connection_service.confirm_connection(request=request)
    return create_response(200, res)


@exception_handler
def deny_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = DenyConnectionRequest(userId=path_params.get("userId"), **body)
    res = connection_service.deny_connection(request=request)
    return create_response(200, res)


@exception_handler
def get_open_requests(event, context):
    path_params = event.get('pathParameters') or {}
    requests = connection_service.get_pending_requests(user_id=path_params.get("userId"))
    return create_response(200, requests)


@exception_handler
def get_connections(event, context):
    path_params = event.get('pathParameters') or {}
    query_params = event.get('queryStringParameters') or {}
    request = SearchConnectionsRequest(
        userId=path_params.get("userId"),
        name=query_params.get("name"),
        permissionGroup=query_params.get("permissionGroup"),
        inSync=query_params.get("inSync"),
        limit=int(query_params.get("limit")) if "limit" in query_params else 25,
        skip=int(query_params.get("skip")) if "skip" in query_params else 0,
    )

    connections = connection_service.get_connections(request=request)
    return create_response(200, connections)


@exception_handler
def get_connection(event, context):
    path_params = event.get('pathParameters') or {}
    res = connection_service.get_user_connection(user_id=path_params.get("userId"),
                                                 other_user_id=path_params.get("connectedUserId"))
    return create_response(200, res)


@exception_handler
def update_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = UpdateConnectionRequest(userId=path_params.get("userId"),
                                      otherUserId=path_params.get("connectedUserId"),
                                      **body)
    res = connection_service.update_connection(request=request)
    return create_response(200, res)


@exception_handler
def block_connection(event, context):
    path_params = event.get('pathParameters') or {}
    request = BlockConnectionRequest(userId=path_params.get("userId"),
                                     other_user_id=path_params.get("connectedUserId"))
    res = connection_service.block_connection(request=request)
    return create_response(200, res)
