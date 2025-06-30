from typing import Dict, Any


class DeviceSettings:
    def __init__(self, body: Dict[str, Any]):
        self.auto_sync = body.get("autoSync", True)
        self.notify_out_of_sync = body.get("notifyOutOfSync", True)
        self.notify_birthdays = body.get("notifyBirthdays", True)

    def to_dict(self):
        return {
            "autoSync": self.auto_sync,
            "notifyOutOfSync": self.notify_out_of_sync,
            "notifyBirthdays": self.notify_birthdays
        }
