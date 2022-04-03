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

class UserNotFoundError extends HttpStatusCodeError {
    constructor() {
        super(`No matching user found`, 404)
    }
}

class UserPhoneNumberAlreadyExistsError extends HttpStatusCodeError {
    constructor(number: string) {
        super(`User already exists with number: ${number}`, 409)
    }
}


export {
    HttpStatusCodeError,
    InvalidRequestError,
    UserNotFoundError,
    UserPhoneNumberAlreadyExistsError
}