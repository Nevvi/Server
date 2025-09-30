from shared.authorization.errors import HttpError


class DeviceDoesNotExistError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message="Device does not exist for user")


class DeviceAlreadyExistsError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=409, message="Device already exists for this user")
