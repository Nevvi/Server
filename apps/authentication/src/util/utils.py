import phonenumbers

from src.model.errors import InvalidRequestError

APP_STORE_CONNECT_PHONE = "+19876543210"


def format_phone_number(phone_number: str) -> str:
    if phone_number == APP_STORE_CONNECT_PHONE:
        return phone_number

    parsed = phonenumbers.parse(phone_number, region="US")
    if not phonenumbers.is_valid_number_for_region(parsed, region_code="US"):
        raise InvalidRequestError(f"Invalid phone number: {phone_number}")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
