from typing import List

from dao.authentication_dao import AuthenticationDao
from dao.connection_dao import ConnectionDao
from dao.connection_request_dao import ConnectionRequestDao
from dao.image_dao import ImageDao
from dao.user_dao import UserDao
from model.connection.connection import UserConnectionView
from model.connection.connection_group import ConnectionGroupView
from model.connection.connection_request import ConnectionRequestView
from model.requests import RequestConnectionRequest, ConfirmConnectionRequest, DenyConnectionRequest, \
    SearchConnectionsRequest, UpdateConnectionRequest, BlockConnectionRequest, CreateGroupRequest, \
    SearchGroupsRequest, AddConnectionToGroupRequest, RemoveConnectionFromGroupRequest
from model.response import SearchResponse
from service.export_service import ExportService
from service.notification_service import NotificationService
from service.suggestion_service import SuggestionService


class UserService:
    def __init__(self):
        self.user_dao = UserDao()
        self.image_dao = ImageDao()
        self.connection_dao = ConnectionDao()
        self.connection_request_dao = ConnectionRequestDao()
        self.authentication_dao = AuthenticationDao()
        self.notification_service = NotificationService()
        self.suggestion_service = SuggestionService()
        self.export_service = ExportService()

    def request_connection(self, request: RequestConnectionRequest) -> ConnectionRequestView:
        pass

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
