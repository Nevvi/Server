from dataclasses import dataclass

from src.model.document import DeviceSettingsDocument
from src.model.requests import DeviceSettingsUpdate
from shared.authorization.view import View


@dataclass
class DeviceSettingsView(View):
    autoSync: bool
    notifyOutOfSync: bool
    notifyBirthdays: bool

    @staticmethod
    def from_doc(doc: DeviceSettingsDocument):
        return DeviceSettingsView(
            autoSync=doc.get("autoSync"),
            notifyOutOfSync=doc.get("notifyOutOfSync"),
            notifyBirthdays=doc.get("notifyBirthdays")
        )

    @staticmethod
    def from_request(update: DeviceSettingsUpdate):
        return DeviceSettingsView(
            autoSync=update.auto_sync,
            notifyOutOfSync=update.notify_out_of_sync,
            notifyBirthdays=update.notify_birthdays,
        )
