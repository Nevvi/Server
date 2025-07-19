import os
from dataclasses import dataclass

from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME
from model.document import ConnectionRequestDocument
from model.enums import RequestStatus
from model.view import View


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
