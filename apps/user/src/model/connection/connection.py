from typing import Dict, Any

from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME


class Connection:
    def __init__(self, body: Dict[str, Any]):
        self.user_id = body.get("userId")
        self.profile_image = body.get("profileImage")
        self.permission_group_name = body.get("permissionGroupName", DEFAULT_ALL_PERMISSION_GROUP_NAME)
        self.in_sync = body.get("inSync")
        self.create_date = body.get("createDate")
        self.create_by = body.get("createBy")
        self.update_date = body.get("updateDate")
        self.update_by = body.get("updateBy")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "userId": self.user_id,
            "profileImage": self.profile_image,
            "permissionGroupName": self.permission_group_name,
            "inSync": self.in_sync,
            "createDate": self.create_date,
            "createBy": self.create_by,
            "updateDate": self.update_date,
            "updateBy": self.update_by
        }
