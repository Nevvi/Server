class HttpError(Exception):
    status_code: int
    message: str

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


class DeviceDoesNotExistError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message="Device does not exist for user")


class DeviceAlreadyExistsError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=409, message="Device already exists for this user")


class InvalidRequestError(HttpError):
    def __init__(self, message: str):
        HttpError.__init__(self, status_code=400, message=message)