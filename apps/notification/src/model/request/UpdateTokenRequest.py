import uuid
from dataclasses import dataclass

from src.error.Errors import InvalidRequestError


def is_valid_uuid(uuid_to_test):
    try:
        uuid.UUID(uuid_to_test, version=4)
    except ValueError:
        return False
    return True


@dataclass
class UpdateTokenRequest:
    user_id: str
    token: str

    def __post_init__(self):
        if not self.user_id or not is_valid_uuid(self.user_id):
            raise InvalidRequestError(message="user_id is required to be a valid uuid")

        if not self.token:
            raise InvalidRequestError(message="token is required")
