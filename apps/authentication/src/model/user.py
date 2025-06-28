from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class User:
    user_id: str
    phone_number: str
    phone_number_verified: bool
    email: Optional[str]
    email_verified: Optional[bool]
    name: Optional[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "userId": self.user_id,
            "phoneNumber": self.phone_number,
            "phoneNumberVerified": self.phone_number_verified,
            "email": self.email,
            "emailVerified": self.email_verified,
            "name": self.name
        }