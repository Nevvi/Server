from dataclasses import dataclass
from typing import List

from model.user.address import Address
from model.user.user import SlimUser
from model.view import View


@dataclass
class SearchResponse(View):
    users: List[SlimUser]
    count: int


@dataclass
class UserConnectionResponse(View):
    id: str
    first_name: str
    last_name: str
    bio: str
    email: str
    phone_number: str
    address: Address
    mailing_address: Address
    profile_image: str
    birthday: str
    permission_group: str
