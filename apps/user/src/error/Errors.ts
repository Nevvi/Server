'use strict'

class InvalidRequestError extends Error {
    private statusCode: number;

    constructor(message: string) {
        super(message)
        this.statusCode = 400;
    }
}

class UserNotFoundError extends Error {
    private statusCode: number;

    constructor(userId: string) {
        super(`User not found with id: ${userId}`)
        this.statusCode = 404;
    }
}

class UserAlreadyExistsError extends Error {
    private statusCode: number;

    constructor(userId: string) {
        super(`User already exists with id: ${userId}`)
        this.statusCode = 409;
    }
}

class ConnectionRequestExistsError extends Error {
    private statusCode: number;

    constructor() {
        super(`Connection request already exists to this user`)
        this.statusCode = 409;
    }
}

class ConnectionRequestDoesNotExistError extends Error {
    private statusCode: number;

    constructor() {
        super(`Connection request does not exist`)
        this.statusCode = 404;
    }
}


export {
    InvalidRequestError,
    UserNotFoundError,
    UserAlreadyExistsError,
    ConnectionRequestExistsError,
    ConnectionRequestDoesNotExistError
}