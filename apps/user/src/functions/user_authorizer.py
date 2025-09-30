from authorization.abstract_authorizer import AbstractAuthorizer
from authorization.auth_policy import AuthPolicy, HttpVerb


class UserAuthorizer(AbstractAuthorizer):
    def __init__(self):
        AbstractAuthorizer.__init__(self)

    def generate_permissions(self, auth_policy: AuthPolicy, user_id: str):
        if user_id is not None:
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/notifications/token")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/search")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/search/contacts")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/notify")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}")
            auth_policy.allow_method(HttpVerb.PATCH, f"/v1/users/{user_id}")
            auth_policy.allow_method(HttpVerb.DELETE, f"/v1/users/{user_id}")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/image")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/image")

            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/invite")

            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/suggestions")
            auth_policy.allow_method(HttpVerb.DELETE, f"/v1/users/{user_id}/suggestions/*")

            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connections")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connections/suggested")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connections/rejected")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connections/*")
            auth_policy.allow_method(HttpVerb.PATCH, f"/v1/users/{user_id}/connections/*")
            auth_policy.allow_method(HttpVerb.DELETE, f"/v1/users/{user_id}/connections/*")

            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connections/requests/pending")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connections/requests")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connections/requests/confirm")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connections/requests/deny")

            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connection-groups")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connection-groups")
            auth_policy.allow_method(HttpVerb.DELETE, f"/v1/users/{user_id}/connection-groups/*")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connection-groups/*/export")
            auth_policy.allow_method(HttpVerb.GET, f"/v1/users/{user_id}/connection-groups/*/connections")
            auth_policy.allow_method(HttpVerb.POST, f"/v1/users/{user_id}/connection-groups/*/connections")
            auth_policy.allow_method(HttpVerb.DELETE, f"/v1/users/{user_id}/connection-groups/*/connections")
        else:
            auth_policy.deny_all_methods()


authorizer = UserAuthorizer()


def authorize(event, context):
    return authorizer.authorize(event)
