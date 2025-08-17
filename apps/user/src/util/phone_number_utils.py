import phonenumbers as phonenumbers

from src.model.errors import InvalidRequestError


def format_phone_number(phone_number: str) -> str:
    parsed = phonenumbers.parse(phone_number, region="US")
    if not phonenumbers.is_possible_number(parsed):
        raise InvalidRequestError(f"Invalid phone number: {phone_number}")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def is_valid_phone_number(phone_number: str) -> bool:
    try:
        parsed = phonenumbers.parse(phone_number, region="US")
        return phonenumbers.is_possible_number(parsed)
    except:
        return False


if __name__ == "__main__":
    number = "612963123"
    parsed = phonenumbers.parse(number, region="US")
    print(is_valid_phone_number(number))
    print(phonenumbers.is_valid_number_for_region(parsed, region_code="US"))
    print(phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164))
    print(parsed)
