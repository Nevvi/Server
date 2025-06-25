from src.functions.AbstractAuthorizer import AbstractAuthorizer
from src.functions.AuthPolicy import AuthPolicy, HttpVerb


class NotificationAuthorizer(AbstractAuthorizer):
    def __init__(self):
        AbstractAuthorizer.__init__(self)

    def generate_permissions(self, auth_policy: AuthPolicy, user_id: str):
        if user_id is not None:
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/notifications/token")
        else:
            auth_policy.deny_all_methods()


notification_authorizer = NotificationAuthorizer()


def authorize(event, context):
    return notification_authorizer.authorize(event)
