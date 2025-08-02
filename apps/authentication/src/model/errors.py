class HttpError(Exception):
    status_code: int
    message: str

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


class InvalidRequestError(HttpError):
    def __init__(self, message: str):
        HttpError.__init__(self, status_code=400, message=message)


class PasswordResetRequiredError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=400, message="Password reset required for the user")


class UserNotFoundError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message="No user found with that id")


class UserEmailAlreadyExistsError(HttpError):
    def __init__(self, email: str):
        HttpError.__init__(self, status_code=409, message=f"User already exists with email: {email}")
