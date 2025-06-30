from enum import Enum
from typing import Dict, Any


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ConnectionRequest:
    def __init__(self, body: Dict[str, Any]):
        self.requesting_user_id = body.get("requestingUserId")
        self.requested_user_id = body.get("requestedUserId")
        self.requester_first_name = body.get("requesterFirstName")
        self.requester_last_name = body.get("requesterLastName")
        self.requester_image = body.get("requesterImage")
        self.requesting_permission_group_name = body.get("requestingPermissionGroupName")
        self.status: RequestStatus = body.get("status")
        self.create_date = body.get("createDate")
        self.create_by = body.get("createBy")
        self.update_date = body.get("updateDate")
        self.update_by = body.get("updateBy")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "requestingUserId": self.requesting_user_id,
            "requestedUserId": self.requested_user_id,
            "requesterFirstName": self.requester_first_name,
            "requesterLastName": self.requester_last_name,
            "requesterImage": self.requester_image,
            "requestingPermissionGroupName": self.requesting_permission_group_name,
            "status": self.status.value,
            "createDate": self.create_date,
            "createBy": self.create_by,
            "updateDate": self.update_date,
            "updateBy": self.update_by
        }
