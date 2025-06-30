from typing import Dict, Any


class ConnectionGroup:
    def __init__(self, body: Dict[str, Any]):
        self.id = body.get("id")
        self.user_id = body.get("userId")
        self.name = body.get("name")
        self.connections = body.get("connections", [])
        self.create_date = body.get("createDate")
        self.create_by = body.get("createBy")
        self.update_date = body.get("updateDate")
        self.update_by = body.get("updateBy")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "connections": self.connections,
            "createDate": self.create_date,
            "createBy": self.create_by,
            "updateDate": self.update_date,
            "updateBy": self.update_by
        }
