class HttpError(Exception):
    status_code: int
    message: str

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


class InvalidRequestError(HttpError):
    def __init__(self, message: str):
        HttpError.__init__(self, status_code=400, message=message)
