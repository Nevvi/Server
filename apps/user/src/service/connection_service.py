from typing import List, Optional

from dao.authentication_dao import AuthenticationDao
from dao.connection_dao import ConnectionDao
from dao.connection_request_dao import ConnectionRequestDao
from dao.image_dao import ImageDao
from model.connection.connection import UserConnectionView
from model.connection.connection_group import ConnectionGroupView
from model.connection.connection_request import ConnectionRequestView
from model.enums import RequestStatus
from model.errors import InvalidRequestError, UserNotFoundError, ConnectionRequestExistsError, AlreadyConnectedError
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
            raise UserNotFoundError()

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
        request_text = f"${requesting_user.firstName} would like to connect!"
        self.notification_service.send_notification(user_id=requested_user.id, message=request_text)
        self.suggestion_service.remove_suggestion(user_id=requesting_user.id, suggested_user_id=requested_user.id)

        return ConnectionRequestView.from_doc(new_request)

    def confirm_connection(self, request: ConfirmConnectionRequest) -> ConnectionRequestView:
        pass

    def deny_connection(self, request: DenyConnectionRequest) -> ConnectionRequestView:
        pass

    def get_pending_requests(self, user_id: str) -> List[ConnectionRequestView]:
        pass

    def get_connections(self, request: SearchConnectionsRequest) -> SearchResponse:
        pass

    def get_connection(self, user_id: str, other_user_id: str) -> UserConnectionView:
        pass

    def update_connection(self, request: UpdateConnectionRequest) -> UserConnectionView:
        pass

    def block_connection(self, request: BlockConnectionRequest) -> bool:
        pass

    def create_group(self, request: CreateGroupRequest) -> ConnectionGroupView:
        pass

    def get_connection_groups(self, user_id: str) -> List[ConnectionGroupView]:
        pass

    def delete_connection_group(self, user_id: str, group_id: str) -> bool:
        pass

    def export_group(self, user_id: str, group_id: str) -> bool:
        pass

    def get_group_connections(self, user_id: str, group_id: str) -> List[UserConnectionView]:
        pass

    def search_group_connections(self, group_id: str, request: SearchGroupsRequest) -> SearchResponse:
        pass

    def add_connection_to_group(self, request: AddConnectionToGroupRequest) -> ConnectionGroupView:
        pass

    def remove_connection_from_group(self, request: RemoveConnectionFromGroupRequest) -> ConnectionGroupView:
        pass
