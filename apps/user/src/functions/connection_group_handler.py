import asyncio
import json
import logging

from shared.authorization.handler_utils import create_response, exception_handler
from src.model.requests import CreateGroupRequest, SearchGroupsRequest, AddConnectionToGroupRequest, \
    RemoveConnectionFromGroupRequest
from src.service.connection_service import ConnectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connection_service = ConnectionService()


@exception_handler
def create_group(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = CreateGroupRequest(userId=path_params.get("userId"), **body)
    res = connection_service.create_group(request=request)
    return create_response(200, res)


@exception_handler
def get_groups(event, context):
    path_params = event.get('pathParameters') or {}
    res = connection_service.get_connection_groups(user_id=path_params.get("userId"))
    return create_response(200, res)


@exception_handler
def delete_group(event, context):
    path_params = event.get('pathParameters') or {}
    res = connection_service.delete_connection_group(user_id=path_params.get("userId"),
                                                     group_id=path_params.get("groupId"))
    return create_response(200, res)


@exception_handler
def export_group(event, context):
    path_params = event.get('pathParameters') or {}
    res = asyncio.run(connection_service.export_group(user_id=path_params.get("userId"),
                                                      group_id=path_params.get("groupId")))
    return create_response(200, res)


@exception_handler
def get_connections(event, context):
    path_params = event.get('pathParameters') or {}
    query_params = event.get('queryStringParameters') or {}
    request = SearchGroupsRequest(
        userId=path_params.get("userId"),
        name=query_params.get("name"),
        limit=int(query_params.get("limit")) if "limit" in query_params else 25,
        skip=int(query_params.get("skip")) if "skip" in query_params else 0,
    )

    connections = connection_service.search_group_connections(group_id=path_params.get("groupId"),
                                                              request=request)
    return create_response(200, connections)


@exception_handler
def add_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = AddConnectionToGroupRequest(userId=path_params.get("userId"),
                                          groupId=path_params.get("groupId"),
                                          connectedUserId=body.get("userId"))
    res = connection_service.add_connection_to_group(request=request)
    return create_response(200, res)


@exception_handler
def remove_connection(event, context):
    path_params = event.get('pathParameters') or {}
    body = json.loads(event.get('body', '{}'))

    request = RemoveConnectionFromGroupRequest(userId=path_params.get("userId"),
                                               groupId=path_params.get("groupId"),
                                               connectedUserId=body.get("userId"))
    res = connection_service.remove_connection_from_group(request=request)
    return create_response(200, res)
