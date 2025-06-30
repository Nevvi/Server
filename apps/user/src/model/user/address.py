from typing import Dict, Any


class Address:
    def __init__(self, body: Dict[str, Any]):
        self.street = body.get("street")
        self.unit = body.get("unit")
        self.city = body.get("city")
        self.state = body.get("state")
        self.zip_code = body.get("zipCode")

    def to_dict(self):
        return {
            "street": self.street,
            "unit": self.unit,
            "city": self.city,
            "state": self.state,
            "zipCode": self.zip_code,
        }
