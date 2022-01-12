'use strict'

class HttpStatusCodeError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode
    }
}

class InvalidRequestError extends HttpStatusCodeError {
    constructor(message: string) {
        super(message, 400)
    }
}

class NotificationGroupDoesNotExistError extends HttpStatusCodeError {
    constructor(id: string) {
        super(`Notification group with id ${id} does not exist`, 404)
    }
}

class NotificationGroupAlreadyExistsError extends HttpStatusCodeError {
    constructor(name: string) {
        super(`Notification group already exists for this user with name: ${name}`, 409)
    }
}

export {
    HttpStatusCodeError,
    InvalidRequestError,
    NotificationGroupDoesNotExistError,
    NotificationGroupAlreadyExistsError
}