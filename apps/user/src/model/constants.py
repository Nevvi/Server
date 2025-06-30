from model.user.permission_group import PermissionGroup

DEFAULT_ALL_PERMISSION_GROUP_NAME: str = "All Info"
DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME: str = "Contact Info"

DEFAULT_PERMISSION_GROUPS = [
    PermissionGroup({"name": DEFAULT_ALL_PERMISSION_GROUP_NAME, "fields": []}),
    PermissionGroup({"name": DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME, "fields": ["email", "phoneNumber"]})
]
