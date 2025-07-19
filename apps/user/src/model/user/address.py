from dataclasses import dataclass

from model.document import AddressDocument
from model.requests import AddressUpdate
from model.view import View


@dataclass
class AddressView(View):
    street: str
    unit: str
    city: str
    state: str
    zipCode: str

    @staticmethod
    def from_doc(doc: AddressDocument):
        return AddressView(
            street=doc.get("street"),
            unit=doc.get("unit"),
            city=doc.get("city"),
            state=doc.get("state"),
            zipCode=doc.get("zipCode")
        )

    @staticmethod
    def from_request(update: AddressUpdate):
        return AddressView(
            street=update.street,
            unit=update.unit,
            city=update.city,
            state=update.state,
            zipCode=update.zip_code,
        )
