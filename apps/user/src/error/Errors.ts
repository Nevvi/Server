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

export {InvalidRequestError, UserNotFoundError, UserAlreadyExistsError}
