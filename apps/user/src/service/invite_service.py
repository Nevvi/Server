import logging

from src.dao.connection_group_dao import ConnectionGroupDao
from src.dao.invite_dao import InviteDao
from src.model.errors import UserNotFoundError
from src.model.requests import InviteConnectionRequest, SearchRequest
from src.service.user_service import UserService
from src.util.phone_number_utils import format_phone_number

logger = logging.getLogger(__name__)


class InviteService:
    def __init__(self):
        self.user_service = UserService()
        self.invite_dao = InviteDao()
        self.connection_group_dao = ConnectionGroupDao()

    async def invite_user(self, request: InviteConnectionRequest):
        user = self.user_service.get_user(user_id=request.requesting_user_id)
        if not user:
            raise UserNotFoundError(request.requesting_user_id)

        search_request = SearchRequest(phoneNumber=request.requested_phone_number)
        existing_user = await self.user_service.search_users(user_id=request.requesting_user_id, request=search_request)
        if existing_user.count > 0:
            logger.info(
                f"User {request.requesting_user_id} tried to invite existing user {request.requested_phone_number}")
            return

        formatted_number = format_phone_number(request.requested_phone_number)
        existing_invites = self.invite_dao.get_invites(phone_number=formatted_number)

        can_invite = len([i for i in existing_invites if i.get("requesterUserId") == user.id]) == 0
        if not can_invite:
            logger.info(f"User {formatted_number} already has an open invite from {user.id}")
            return

        logger.info(f"Creating invite from {user.id} to user {formatted_number}")
        self.invite_dao.create_invite(phone_number=formatted_number,
                                      requesting_user_id=user.id,
                                      permission_group=request.permission_group_name,
                                      connection_group_ids=request.connection_group_ids)

        existing_groups = self.connection_group_dao.get_groups(user_id=user.id)
        for group in [g for g in existing_groups if g.get("_id") in request.connection_group_ids]:
            group_id = group.get('_id')
            logger.info(f"Adding invited number {formatted_number} to group {group_id}")
            self.connection_group_dao.add_invite(user_id=user.id, group_id=group_id, phone_number=formatted_number)
