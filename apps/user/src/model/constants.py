from model.response import SearchResponse
from model.user.permission_group import PermissionGroupView

DEFAULT_ALL_PERMISSION_GROUP_NAME: str = "All Info"
DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME: str = "Contact Info"

DEFAULT_PERMISSION_GROUPS = [
    PermissionGroupView(name=DEFAULT_ALL_PERMISSION_GROUP_NAME, fields=[]),
    PermissionGroupView(name=DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME, fields=["email", "phoneNumber"])
]

EMPTY_SEARCH_RESPONSE = SearchResponse(count=0, users=[])