from textwrap import dedent

from src.dao.invite_dao import InviteDao
from src.model.errors import UserNotFoundError
from src.model.requests import InviteConnectionRequest, SearchRequest
from src.service.user_service import UserService
from src.util.phone_number_utils import format_phone_number


class InviteService:
    def __init__(self):
        self.user_service = UserService()
        self.invite_dao = InviteDao()

    async def invite_user(self, request: InviteConnectionRequest):
        user = self.user_service.get_user(user_id=request.requesting_user_id)
        if not user:
            raise UserNotFoundError(request.requesting_user_id)

        search_request = SearchRequest(phoneNumber=request.requested_phone_number)
        existing_user = await self.user_service.search_users(user_id=request.requesting_user_id, request=search_request)
        if existing_user.count > 0:
            print(f"User {request.requesting_user_id} tried to invite existing user {request.requested_phone_number}")
            return

        formatted_number = format_phone_number(request.requested_phone_number)
        existing_invites = self.invite_dao.get_invites(phone_number=formatted_number)
        can_notify = len(existing_invites) == 0
        can_invite = len([i for i in existing_invites if i.get("requesterUserId") == user.id]) == 0

        if not can_invite:
            print(f"User {formatted_number} already has an open invite from {user.id}")
            return

        print(f"Creating invite from {user.id} to user {formatted_number}")
        self.invite_dao.create_invite(phone_number=formatted_number,
                                      requesting_user_id=user.id,
                                      permission_group=request.permission_group_name)

        if can_notify:
            print(f"Notifying user {formatted_number} of their invite")
            message = dedent(f"""
            {user.firstName} {user.lastName} has invited you to join Nevvi! With Nevvi you never have to ask for an address again.
            
            Get started: https://nevvi.net
            """)
            self.invite_dao.send_invite(phone_number=formatted_number, message=message)
