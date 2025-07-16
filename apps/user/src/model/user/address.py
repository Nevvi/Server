from typing import Dict, Any

from model.view import View


class Address:
    def __init__(self, body: Dict[str, Any]):
        self.street = body.get("street")
        self.unit = body.get("unit")
        self.city = body.get("city")
        self.state = body.get("state")
        self.zip_code = body.get("zipCode")
