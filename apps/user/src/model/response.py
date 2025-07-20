from dataclasses import dataclass
from typing import List

from dao.connection_dao import ConnectionSearchResponse
from model.document import ConnectionGroupSearch
from model.user.address import AddressView
from model.user.user import SlimUserView
from model.view import View


@dataclass
class SearchResponse(View):
    users: List[SlimUserView]
    count: int

    @staticmethod
    def from_response(res: ConnectionSearchResponse):
        users = [SlimUserView.from_searched_connection(doc) for doc in res.connections]
        return SearchResponse(users=users, count=res.count)

    @staticmethod
    def from_group_response(res: ConnectionGroupSearch):
        users = [SlimUserView.from_searched_user(doc) for doc in res.connections]
        return SearchResponse(users=users, count=res.count)


@dataclass
class UserConnectionResponse:
    id: str
    firstName: str
    lastName: str
    bio: str
    email: str
    phoneNumber: str
    address: AddressView
    mailingAddress: AddressView
    profileImage: str
    birthday: str
    permissionGroup: str


EMPTY_SEARCH_RESPONSE = SearchResponse(count=0, users=[])
