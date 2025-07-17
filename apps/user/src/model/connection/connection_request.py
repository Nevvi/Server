import os
from dataclasses import dataclass
from enum import Enum

from dao.connection_request_dao import ConnectionRequestDocument
from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME
from model.view import View


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


@dataclass
class ConnectionRequestView(View):
    requestingUserId: str
    requestedUserId: str
    requesterFirstName: str
    requesterLastName: str
    requesterImage: str
    requestingPermissionGroupName: str
    status: RequestStatus

    @staticmethod
    def from_doc(doc: ConnectionRequestDocument):
        return ConnectionRequestView(
            requestingUserId=doc.get("requestingUserId"),
            requestedUserId=doc.get("requestedUserId"),
            requesterFirstName=doc.get("requesterFirstName"),
            requesterLastName=doc.get("requesterLastName"),
            requesterImage=doc.get("requesterImage", os.environ["DEFAULT_PROFILE_IMAGE"]),
            requestingPermissionGroupName=doc.get("requestingPermissionGroupName", DEFAULT_ALL_PERMISSION_GROUP_NAME),
            status=doc.get("status")
        )
