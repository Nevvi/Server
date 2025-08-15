import asyncio

from src.model.requests import InviteConnectionRequest
from src.util.phone_number_utils import format_phone_number
from tests.integration.integration_test import IntegrationTest


class TestInviteIntegration(IntegrationTest):
    def test_invite_user_has_not_been_invited_yet(self):
        invite_number = "6511234567"
        user_invites = self.get_invites(phone_number=format_phone_number(invite_number))
        assert len(user_invites) == 0

        request = InviteConnectionRequest(requestingUserId=self.user.id,
                                          phoneNumber=invite_number,
                                          permissionGroupName="All Info")

        asyncio.run(self.invite_service.invite_user(request=request))

        user_invites = self.get_invites(phone_number=format_phone_number(invite_number))
        assert len(user_invites) == 1
        assert user_invites[0].get("requesterUserId") == self.user.id
