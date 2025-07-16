from dataclasses import dataclass
from typing import List

from dao.connection_group_dao import ConnectionGroupDocument
from model.document import View


@dataclass
class ConnectionGroup(View):
    id: str
    user_id: str
    name: str
    connections: List[str]

    @staticmethod
    def from_document(doc: ConnectionGroupDocument):
        return ConnectionGroup(
            id=doc.id,
            name=doc.name,
            user_id=doc.user_id,
            connections=doc.connections
        )
