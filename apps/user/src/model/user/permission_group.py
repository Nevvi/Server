from dataclasses import dataclass
from typing import List

from model.constants import DEFAULT_ALL_PERMISSION_GROUP_NAME, DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME
from model.document import PermissionGroupDocument
from model.requests import PermissionGroupUpdate
from model.view import View


@dataclass
class PermissionGroupView(View):
    name: str
    fields: List[str]

    @staticmethod
    def from_doc(doc: PermissionGroupDocument):
        return PermissionGroupView(
            name=doc.get("name"),
            fields=doc.get("fields"),
        )

    @staticmethod
    def from_request(update: PermissionGroupUpdate):
        return PermissionGroupView(
            name=update.name,
            fields=update.fields,
        )


DEFAULT_PERMISSION_GROUPS = [
    PermissionGroupView(name=DEFAULT_ALL_PERMISSION_GROUP_NAME, fields=[]),
    PermissionGroupView(name=DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME, fields=["email", "phoneNumber"])
]