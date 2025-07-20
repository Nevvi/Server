from integration.integration_test import IntegrationTest
from model.enums import RequestStatus
from model.requests import RequestConnectionRequest


class TestConnection(IntegrationTest):

    def test_request_connection(self):
        test_user = self.create_user()

        pending_requests = self.connection_service.get_pending_requests(user_id=test_user.id)
        assert len(pending_requests) == 0

        request = RequestConnectionRequest(requestingUserId=self.user.id, requestedUserId=test_user.id,
                                           permissionGroupName="ALL")
        res = self.connection_service.request_connection(request=request)
        assert res.status == RequestStatus.PENDING

        pending_requests = self.connection_service.get_pending_requests(user_id=test_user.id)
        assert len(pending_requests) == 1

        expected_notification = {
            "userId": test_user.id,
            "title": "Nevvi",
            "body": f"{self.user.firstName} would like to connect!"
        }
        assert self.assert_sqs_message_sent(expected_body=expected_notification, queue_url=self.notification_queue)
