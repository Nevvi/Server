import asyncio
from typing import List, Optional

from dao.authentication_dao import AuthenticationDao
from dao.connection_dao import ConnectionDao
from dao.connection_group_dao import ConnectionGroupDao
from dao.connection_request_dao import ConnectionRequestDao
from dao.image_dao import ImageDao
from model.connection.connection import UserConnectionView
from model.connection.connection_group import ConnectionGroupView
from model.connection.connection_request import ConnectionRequestView
from model.enums import RequestStatus
from model.errors import InvalidRequestError, UserNotFoundError, ConnectionRequestExistsError, AlreadyConnectedError, \
    ConnectionRequestDoesNotExistError, ConnectionDoesNotExistError, GroupDoesNotExistError, UserAlreadyInGroupError, \
    UserNotInGroupError
from model.requests import RequestConnectionRequest, ConfirmConnectionRequest, DenyConnectionRequest, \
    SearchConnectionsRequest, UpdateConnectionRequest, BlockConnectionRequest, CreateGroupRequest, \
    SearchGroupsRequest, AddConnectionToGroupRequest, RemoveConnectionFromGroupRequest
from model.response import SearchResponse
from service.export_service import ExportService
from service.notification_service import NotificationService
from service.suggestion_service import SuggestionService
from service.user_service import UserService


class ConnectionService:
    def __init__(self):
        self.image_dao = ImageDao()
        self.connection_dao = ConnectionDao()
        self.connection_request_dao = ConnectionRequestDao()
        self.connection_group_dao = ConnectionGroupDao()
        self.authentication_dao = AuthenticationDao()
        self.notification_service = NotificationService()
        self.suggestion_service = SuggestionService()
        self.export_service = ExportService()
        self.user_service = UserService()

    def get_connection_request(self, requesting_user: str, requested_user: str) -> Optional[ConnectionRequestView]:
        res = self.connection_request_dao.get_connection_request(requesting_user_id=requesting_user,
                                                                 requested_user_id=requested_user)

        return ConnectionRequestView.from_doc(res) if res else None

    def request_connection(self, request: RequestConnectionRequest) -> ConnectionRequestView:
        if request.requested_user_id == request.requesting_user_id:
            raise InvalidRequestError("Cannot request connection to yourself")

        requesting_user = self.user_service.get_user(user_id=request.requesting_user_id)
        if not requesting_user or not requesting_user.firstName:
            raise InvalidRequestError("User requires first name before requesting connections")

        requested_user = self.user_service.get_user(user_id=request.requested_user_id)
        if not requested_user:
            raise UserNotFoundError(request.requested_user_id)

        # If the requested user blocked this user then send back a generic error message
        if requesting_user.id in requested_user.blockedUsers:
            raise ConnectionRequestExistsError()

        # If this user previous blocked that user we need to remove them from the list of blocked users
        # and any previously rejected requests
        if requested_user.id in requesting_user.blockedUsers:
            requested_user.remove_blocked_user(blocked_user_id=requested_user.id)
            self.user_service.save_user(user=requested_user)
            self.connection_request_dao.delete_connection_request(requesting_user_id=requesting_user.id,
                                                                  requested_user_id=requested_user.id)

        # if an existing request exists in any state then do nothing
        # PENDING - one already exists, don't create another
        # REJECTED - requestedUserId already rejected this user, do nothing
        # APPROVED - these two are already connected
        existing_request = self.get_connection_request(requesting_user=requesting_user.id,
                                                       requested_user=requested_user.id)
        if existing_request:
            raise ConnectionRequestExistsError()

        # check if requested user has also requested the requesting user (treat as a confirm)
        existing_request = self.get_connection_request(requesting_user=requested_user.id,
                                                       requested_user=requesting_user.id)

        if existing_request and existing_request.status == RequestStatus.APPROVED:
            raise AlreadyConnectedError()
        elif existing_request and existing_request.status == RequestStatus.PENDING:
            request = ConfirmConnectionRequest(requestingUserId=requested_user.id,
                                               requestedUserId=requesting_user.id,
                                               permissionGroupName=request.permission_group_name)
            return self.confirm_connection(request=request)

        # All checks pass... Create the new request!
        new_request = self.connection_request_dao.create_connection_request(requesting_user=requesting_user,
                                                                            requested_user_id=requested_user.id,
                                                                            permission_group_name=request.permission_group_name)

        # Notify the requested user and remove the requested user as a suggestion
        request_text = f"{requesting_user.firstName} would like to connect!"
        self.notification_service.send_notification(user_id=requested_user.id, message=request_text)
        self.suggestion_service.remove_suggestion(user_id=requesting_user.id, suggested_user_id=requested_user.id)

        return ConnectionRequestView.from_doc(new_request)

    def confirm_connection(self, request: ConfirmConnectionRequest) -> ConnectionRequestView:
        existing_request = self.get_connection_request(requesting_user=request.requesting_user_id,
                                                       requested_user=request.requested_user_id)
        if not existing_request:
            raise ConnectionRequestDoesNotExistError()

        requesting_user = self.user_service.get_user(user_id=request.requesting_user_id)
        if not requesting_user:
            raise UserNotFoundError(request.requesting_user_id)

        requested_user = self.user_service.get_user(user_id=request.requested_user_id)
        if not requested_user:
            raise UserNotFoundError(request.requested_user_id)

        if existing_request != RequestStatus.PENDING:
            raise InvalidRequestError("Request is not in a pending status")

        # All checks pass!
        # Update the connection request status
        # Create the connections for both users
        # Remove each user as suggestions to each other
        # Send a notification
        # TODO - use asyncio to run these operations in parallel
        existing_request.status = RequestStatus.APPROVED
        self.connection_request_dao.update_connection_request(requesting_user_id=request.requesting_user_id,
                                                              requested_user_id=request.requested_user_id,
                                                              status=RequestStatus.APPROVED)

        self.connection_dao.create_connection(user_id=request.requesting_user_id,
                                              connected_user_id=request.requested_user_id,
                                              permission_group_name=existing_request.requestingPermissionGroupName)

        self.connection_dao.create_connection(user_id=request.requested_user_id,
                                              connected_user_id=request.requesting_user_id,
                                              permission_group_name=request.permission_group_name)

        request_text = f"${requested_user.firstName} accepted your request!"
        self.notification_service.send_notification(user_id=request.requesting_user_id, message=request_text)

        self.suggestion_service.remove_suggestion(user_id=request.requesting_user_id,
                                                  suggested_user_id=request.requested_user_id)

        self.suggestion_service.remove_suggestion(user_id=request.requested_user_id,
                                                  suggested_user_id=request.requesting_user_id)

        return existing_request

    def deny_connection(self, request: DenyConnectionRequest) -> ConnectionRequestView:
        existing_request = self.get_connection_request(requesting_user=request.other_user_id,
                                                       requested_user=request.user_id)
        if not existing_request:
            raise ConnectionRequestDoesNotExistError()

        requested_user = self.user_service.get_user(user_id=request.user_id)
        if not requested_user:
            raise UserNotFoundError(request.user_id)

        if existing_request != RequestStatus.PENDING:
            raise InvalidRequestError("Request is not in a pending status")

        # All checks pass!
        # Update the connection request status
        # Block the user from being seen
        # Remove each user as suggestions to each other
        # TODO - use asyncio to run these operations in parallel
        existing_request.status = RequestStatus.REJECTED
        self.connection_request_dao.update_connection_request(requesting_user_id=request.other_user_id,
                                                              requested_user_id=request.user_id,
                                                              status=RequestStatus.REJECTED)

        requested_user.add_blocked_user(blocked_user_id=request.other_user_id)
        self.user_service.save_user(user=requested_user)

        self.suggestion_service.remove_suggestion(user_id=request.other_user_id,
                                                  suggested_user_id=request.user_id)

        self.suggestion_service.remove_suggestion(user_id=request.user_id,
                                                  suggested_user_id=request.other_user_id)

        return existing_request

    def get_pending_requests(self, user_id: str) -> List[ConnectionRequestView]:
        request_docs = self.connection_request_dao.get_connection_requests(requested_user_id=user_id,
                                                                           status=RequestStatus.PENDING)
        return [ConnectionRequestView.from_doc(doc) for doc in request_docs]

    def get_connections(self, request: SearchConnectionsRequest) -> SearchResponse:
        res = self.connection_dao.get_connections(user_id=request.user_id,
                                                  name=request.name,
                                                  in_sync=request.in_sync,
                                                  permission_group=request.permission_group,
                                                  limit=request.limit,
                                                  skip=request.skip)
        return SearchResponse.from_response(res)

    def get_user_connection(self, user_id: str, other_user_id: str) -> UserConnectionView:
        connection_to_me = self.connection_dao.get_connection(user_id=user_id, connected_user_id=other_user_id)
        connection_to_them = self.connection_dao.get_connection(user_id=other_user_id, connected_user_id=user_id)
        if not connection_to_me or not connection_to_them:
            raise ConnectionDoesNotExistError()

        other_user = self.user_service.get_user(user_id=other_user_id)
        if not other_user:
            raise UserNotFoundError(other_user_id)

        their_permission_group_name = connection_to_them.get("permissionGroupName")
        return UserConnectionView.from_connected_user(user=other_user,
                                                      permission_group_name=their_permission_group_name)

    def update_connection(self, request: UpdateConnectionRequest) -> UserConnectionView:
        success = self.connection_dao.update_connection(user_id=request.user_id,
                                                        connected_user_id=request.other_user_id,
                                                        permission_group=request.permission_group_name,
                                                        in_sync=request.in_sync)
        if not success:
            raise ConnectionDoesNotExistError()

        return self.get_user_connection(user_id=request.user_id, other_user_id=request.other_user_id)

    def block_connection(self, request: BlockConnectionRequest) -> bool:
        existing_request = self.get_connection_request(requesting_user=request.other_user_id,
                                                       requested_user=request.user_id)
        if not existing_request:
            existing_request = self.get_connection_request(requesting_user=request.user_id,
                                                           requested_user=request.other_user_id)
        if not existing_request:
            raise ConnectionRequestDoesNotExistError()

        # We need to do a few things here...
        # 1. Blocked the user
        # 2. Delete the connections
        # 3. Delete the connection requests
        user = self.user_service.get_user(user_id=request.user_id)
        user.add_blocked_user(blocked_user_id=request.other_user_id)
        self.user_service.save_user(user=user)

        self.connection_dao.delete_connection(user_id=request.user_id, connected_user_id=request.other_user_id)
        self.connection_dao.delete_connection(user_id=request.other_user_id, connected_user_id=request.user_id)

        self.connection_request_dao.delete_connection_request(requesting_user_id=existing_request.requestingUserId,
                                                              requested_user_id=existing_request.requestedUserId)
        self.connection_request_dao.delete_connection_request(requesting_user_id=existing_request.requestedUserId,
                                                              requested_user_id=existing_request.requestingUserId)

    def create_group(self, request: CreateGroupRequest) -> ConnectionGroupView:
        existing_groups = self.get_connection_groups(user_id=request.user_id)
        if len(existing_groups) >= 10:
            raise InvalidRequestError(f"User cannot have more than 10 groups")

        new_group = self.connection_group_dao.create_group(user_id=request.user_id, name=request.name)
        return ConnectionGroupView.from_document(new_group)

    def get_connection_groups(self, user_id: str) -> List[ConnectionGroupView]:
        docs = self.connection_group_dao.get_groups(user_id=user_id)
        return [ConnectionGroupView.from_document(doc) for doc in docs]

    def delete_connection_group(self, user_id: str, group_id: str) -> bool:
        return self.connection_group_dao.delete_group(user_id=user_id, group_id=group_id)

    async def export_group(self, user_id: str, group_id: str) -> bool:
        group = self.connection_group_dao.get_group(user_id=user_id, group_id=group_id)
        if not group:
            raise GroupDoesNotExistError(group_id)

        user = self.user_service.get_user(user_id=user_id)
        if not user or not user.email or not user.emailConfirmed:
            raise InvalidRequestError(f"User must have a confirmed email to export connections")

        connections = await self.get_group_connections(user_id=user_id, group_id=group_id)
        if not len(connections):
            raise InvalidRequestError(f"Cannot export an empty group")

        print(f"Exporting {len(connections)} connections for group {group.get('name')}")
        self.export_service.send_export(group_name=group.get("name"), user=user, connections=connections)

        return True

    async def get_group_connections(self, user_id: str, group_id: str) -> List[UserConnectionView]:
        group = self.connection_group_dao.get_group(user_id=user_id, group_id=group_id)
        if not group:
            raise GroupDoesNotExistError(group_id)

        async def process_item(connection_id, semaphore):
            async with semaphore:
                return self.get_user_connection(user_id=user_id, other_user_id=connection_id)

        concurrency_semaphore = asyncio.Semaphore(10)
        tasks = [process_item(id, concurrency_semaphore) for id in group.get("connections", [])]

        return await asyncio.gather(*tasks)

    def search_group_connections(self, group_id: str, request: SearchGroupsRequest) -> SearchResponse:
        res = self.connection_group_dao.get_connections(user_id=request.user_id,
                                                        group_id=group_id,
                                                        name=request.name,
                                                        limit=request.limit,
                                                        skip=request.skip)
        return SearchResponse.from_group_response(res)

    def add_connection_to_group(self, request: AddConnectionToGroupRequest) -> ConnectionGroupView:
        group = self.connection_group_dao.get_group(user_id=request.user_id, group_id=request.group_id)
        if not group:
            raise GroupDoesNotExistError(request.group_id)

        group = ConnectionGroupView.from_document(group)
        connection = self.get_user_connection(user_id=request.user_id, other_user_id=request.connected_user_id)
        if not connection:
            raise ConnectionDoesNotExistError()

        if request.connected_user_id in group.connections:
            raise UserAlreadyInGroupError()

        if len(group.connections) >= 200:
            raise InvalidRequestError("Group cannot exceed 200 connections")

        success = self.connection_group_dao.add_user(user_id=request.user_id,
                                                     group_id=request.group_id,
                                                     connected_user_id=request.connected_user_id)

        if success:
            group.add_user(request.connected_user_id)

        return group

    def remove_connection_from_group(self, request: RemoveConnectionFromGroupRequest) -> ConnectionGroupView:
        group = self.connection_group_dao.get_group(user_id=request.user_id, group_id=request.group_id)
        if not group:
            raise GroupDoesNotExistError(request.group_id)

        group = ConnectionGroupView.from_document(group)
        if request.connected_user_id not in group.connections:
            raise UserNotInGroupError()

        success = self.connection_group_dao.remove_user(user_id=request.user_id,
                                                        group_id=request.group_id,
                                                        connected_user_id=request.connected_user_id)

        if success:
            group.remove_user(request.connected_user_id)

        return group
