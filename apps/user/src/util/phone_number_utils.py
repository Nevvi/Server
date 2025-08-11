import phonenumbers as phonenumbers

from src.model.errors import InvalidRequestError


def format_phone_number(phone_number: str) -> str:
    parsed = phonenumbers.parse(phone_number, region="US")
    if not phonenumbers.is_possible_number(parsed):
        raise InvalidRequestError(f"Invalid phone number: {phone_number}")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


# if __name__ == "__main__":
#     number = "5555648583"
#     parsed = phonenumbers.parse(number, region="US")
#     print(phonenumbers.is_possible_number(parsed))
#     print(phonenumbers.is_valid_number_for_region(parsed, region_code="US"))
#     print(phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164))
#     print(parsed)
