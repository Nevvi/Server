from typing import Dict, Any


class DeviceSettings:
    def __init__(self, body: Dict[str, Any]):
        self.auto_sync = body.get("autoSync", True)
        self.notify_out_of_sync = body.get("notifyOutOfSync", True)
        self.notify_birthdays = body.get("notifyBirthdays", True)
