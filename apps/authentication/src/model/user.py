from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    user_id: str
    phone_number: str
    phone_number_verified: bool
    email: Optional[str]
    email_verified: Optional[bool]
    name: Optional[str]
