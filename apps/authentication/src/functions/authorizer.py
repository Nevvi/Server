from authorization.abstract_authorizer import AbstractAuthorizer
from authorization.auth_policy import AuthPolicy, HttpVerb


class Authorizer(AbstractAuthorizer):
    def __init__(self):
        AbstractAuthorizer.__init__(self)

    def generate_permissions(self, auth_policy: AuthPolicy, user_id: str):
        if user_id is not None:
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/sendCode")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/confirmCode")
        else:
            auth_policy.deny_all_methods()


authorizer = Authorizer()


def authorize(event, context):
    return authorizer.authorize(event)
