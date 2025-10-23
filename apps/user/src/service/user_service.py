import asyncio
import copy
from datetime import datetime

import itertools
from typing import Optional, List

from shared.authorization.errors import InvalidRequestError
from src.dao.authentication_dao import AuthenticationDao
from src.dao.connection_dao import ConnectionDao
from src.dao.connection_request_dao import ConnectionRequestDao
from src.dao.image_dao import ImageDao
from src.dao.invite_dao import InviteDao
from src.dao.user_dao import UserDao
from src.model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME
from src.model.errors import UserNotFoundError
from src.model.requests import RegisterRequest, SearchRequest, UpdateRequest, UpdateContactRequest
from src.model.response import SearchResponse, EMPTY_SEARCH_RESPONSE, ContactSearchResponse
from src.model.user.user import UserView, SlimUserView
from src.util.list_utils import chunk_list
from src.util.phone_number_utils import format_phone_number, is_valid_phone_number


class UserService:
    def __init__(self):
        self.user_dao = UserDao()
        self.image_dao = ImageDao()
        self.connection_dao = ConnectionDao()
        self.connection_request_dao = ConnectionRequestDao()
        self.authentication_dao = AuthenticationDao()
        self.invite_dao = InviteDao()

    def get_user(self, user_id: str) -> Optional[UserView]:
        user = self.user_dao.get_user(user_id=user_id)
        return UserView.from_doc(user) if user else None

    def create_user(self, request: RegisterRequest) -> UserView:
        # Create the user entry
        user = self.user_dao.create_user(user_id=request.id, phone_number=request.phone_number)

        # Check if anyone invited this user and create connection requests to the created user
        invites = self.invite_dao.get_invites(format_phone_number(request.phone_number))
        for invite in invites:
            requesting_user = self.get_user(user_id=invite.get("requesterUserId"))
            if not requesting_user:
                continue

            permission_group = invite.get("requesterPermissionGroupName")
            self.connection_request_dao.create_connection_request(requesting_user=requesting_user,
                                                                  requested_user_id=user.get("_id"),
                                                                  permission_group_name=permission_group)
        return UserView.from_doc(user)

    async def search_potential_contacts(self, user_id: str, phone_numbers: List[str]) -> ContactSearchResponse:
        valid_numbers = [p for p in phone_numbers if is_valid_phone_number(p)]
        formatted_numbers = [format_phone_number(p) for p in valid_numbers]
        print(f"Searching for {len(formatted_numbers)} phone numbers")

        async def get_users(formatted_phone_numbers: List[str], semaphore):
            async with semaphore:
                return self.user_dao.search_users(user_id=user_id, name=None, phone_numbers=formatted_phone_numbers,
                                                  skip=0, limit=len(valid_numbers))

        concurrency_semaphore = asyncio.Semaphore(10)
        tasks = [get_users(chunk, concurrency_semaphore) for chunk in chunk_list(formatted_numbers, 20)]
        print(f"Waiting for {len(tasks)} phone number search tasks")

        users_chunks = await asyncio.gather(*tasks)
        users = list(itertools.chain.from_iterable(users_chunks))
        matching_phones = set([user.phoneNumber for user in users])
        missing_users = [phone for phone in valid_numbers if format_phone_number(phone) not in matching_phones]
        return ContactSearchResponse(matching=[SlimUserView.from_searched_user(user) for user in users],
                                     missing=missing_users)

    async def search_users(self, user_id: str, request: SearchRequest) -> SearchResponse:
        if request.email:
            user = self.user_dao.get_user_by_email(email=request.email)
            return SearchResponse(count=1, users=[SlimUserView.from_user_doc(user)]) if user else EMPTY_SEARCH_RESPONSE

        if request.phone_number:
            user = self.user_dao.get_user_by_phone(phone_number=format_phone_number(request.phone_number))
            return SearchResponse(count=1, users=[SlimUserView.from_user_doc(user)]) if user else EMPTY_SEARCH_RESPONSE

        users = self.user_dao.search_users(user_id=user_id, name=request.name, phone_numbers=[], skip=request.skip,
                                           limit=request.limit)
        count = self.user_dao.search_user_count(user_id=user_id, name=request.name, phone_numbers=[])
        return SearchResponse(count=count, users=[SlimUserView.from_searched_user(user) for user in users])

    def update_user(self, user: UserView, request: UpdateRequest) -> UserView:
        updated_user = copy.deepcopy(user)
        updated_user.update(request=request)

        # Some permission group actions are off limits
        updated_permission_groups = set([pg.name for pg in updated_user.permissionGroups])
        removed_permission_groups = [pg for pg in user.permissionGroups if pg.name not in updated_permission_groups]
        for pg in removed_permission_groups:
            if pg.name == DEFAULT_ALL_PERMISSION_GROUP_NAME:
                raise InvalidRequestError("Cannot delete the default ALL group")
            if self.connection_dao.connections_exist_in_permission_group(user_id=user.id, permission_group=pg.name):
                raise InvalidRequestError(f"Cannot delete permission group {pg.name} with existing connections")

        # Auth API controls email verification and needs to know about the new email
        if request.email and request.email != user.email:
            print("Updating user email")
            updated_auth_user = self.authentication_dao.update_user(user_id=user.id, email=request.email)
            if not updated_auth_user.get("emailVerified", False):
                updated_user.emailConfirmed = False

        # Update the user in the db and mark all their connections as out of sync if applicable
        updated_user = self.save_user(user=updated_user)
        if user.did_connection_data_change(other=updated_user):
            print("Connection data changed for user")
            marked = self.connection_dao.mark_connections(user_id=user.id)
            print(f"Marked {marked} connections as out of sync")

        return updated_user

    def save_user(self, user: UserView) -> UserView:
        return UserView.from_doc(self.user_dao.update_user(user=user))

    def update_user_contact(self, user: UserView, request: UpdateContactRequest) -> UserView:
        user.email = request.email if request.email else user.email
        user.emailConfirmed = request.email_confirmed if request.email_confirmed else user.emailConfirmed
        user = self.user_dao.update_user(user=user)
        return UserView.from_doc(user)

    def update_user_image(self, user_id: str, image: any) -> UserView:
        user = self.get_user(user_id=user_id)
        if not user:
            raise UserNotFoundError(user_id)

        user.profileImage = self.image_dao.upload_image(user_id=user_id, image=image)
        self.image_dao.remove_old_images(user_id=user_id, excluded_key=image["filename"])

        updated_user = self.user_dao.update_user(user=user)
        return UserView.from_doc(updated_user)

    def get_blocked_users(self, user_id: str) -> List[SlimUserView]:
        users = self.user_dao.get_blocked_users(user_id=user_id)
        return [SlimUserView.from_user_doc(user) for user in users]

    def get_users_by_birthday(self, birthday: datetime) -> List[UserView]:
        users = self.user_dao.get_users_by_birthday(birthday=birthday)
        return [UserView.from_doc(doc) for doc in users]
