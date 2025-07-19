from dataclasses import dataclass
from typing import List

from model.user.address import AddressView
from model.user.user import SlimUserView
from model.view import View


@dataclass
class SearchResponse(View):
    users: List[SlimUserView]
    count: int


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
