from typing import Dict, Any

DEFAULT_PERMISSION_GROUP_FIELDS = ["id", "firstName", "lastName", "bio", "profileImage"]


class PermissionGroup:
    def __init__(self, body: Dict[str, Any]):
        self.name = body.get("name")
        self.fields = body.get("fields")

    def get_fields(self):
        return set(self.fields + DEFAULT_PERMISSION_GROUP_FIELDS)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "fields": self.fields
        }
