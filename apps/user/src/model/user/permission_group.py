from dataclasses import dataclass
from typing import List

from dao.user_dao import PermissionGroupDocument
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
