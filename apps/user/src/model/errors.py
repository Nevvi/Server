class HttpError(Exception):
    status_code: int
    message: str

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


class InvalidRequestError(HttpError):
    def __init__(self, message: str):
        HttpError.__init__(self, status_code=400, message=message)


class UserNotFoundError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message="No user found with that id")


class UserAlreadyExistsError(HttpError):
    def __init__(self, user_id: str):
        HttpError.__init__(self, status_code=409, message=f"User already exists with id: {user_id}")


class ConnectionRequestExistsError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=409, message=f"Connection request already exists to this user")


class AlreadyConnectedError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=409, message=f"Users are already connected")


class ConnectionRequestDoesNotExistError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message=f"Connection request does not exist")


class ConnectionExistsError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=409, message=f"Connection already exists to this user")


class ConnectionDoesNotExistError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=404, message=f"Connection does not exist")


class ConnectionGroupExistsError(HttpError):
    def __init__(self, name: str):
        HttpError.__init__(self, status_code=409, message=f"Group already exists for this user with this name: {name}")


class GroupDoesNotExistError(HttpError):
    def __init__(self, id: str):
        HttpError.__init__(self, status_code=404, message=f"Group does not exist for this user with this id: {id}")


class UserAlreadyInGroupError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=400, message=f"User already a member of this group")


class UserNotInGroupError(HttpError):
    def __init__(self):
        HttpError.__init__(self, status_code=400, message=f"User not a member of this group")
