from enum import Enum


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class InviteReason(str, Enum):
    WEDDING = "WEDDING"
    HOLIDAY_CARDS = "HOLIDAY_CARDS"
