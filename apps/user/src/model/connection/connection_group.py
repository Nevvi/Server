from dataclasses import dataclass
from typing import List

from model.document import ConnectionGroupDocument
from model.view import View


@dataclass
class ConnectionGroupView(View):
    id: str
    userId: str
    name: str
    connections: List[str]

    @staticmethod
    def from_document(doc: ConnectionGroupDocument):
        return ConnectionGroupView(
            id=doc.get("_id"),
            name=doc.get("name"),
            userId=doc.get("userId"),
            connections=doc.get("connections")
        )

    def add_user(self, user_id: str):
        self.connections.append(user_id)
        self.connections = list(set(self.connections))

    def remove_user(self, user_id: str):
        self.connections = [c for c in self.connections if c != user_id]
