'use strict'

class InvalidRequestError extends Error {
    private statusCode: number;

    constructor(message: string) {
        super(message)
        this.statusCode = 400;
    }
}

class DeviceAlreadyExistsError extends Error {
    private statusCode: number;

    constructor(userId: string) {
        super(`Device already exists for this user id: ${userId}`)
        this.statusCode = 409;
    }
}

class DeviceDoesNotExistError extends Error {
    private statusCode: number;

    constructor(userId: string) {
        super(`Device does not exist for this user id: ${userId}`)
        this.statusCode = 404;
    }
}


export {
    InvalidRequestError,
    DeviceAlreadyExistsError,
    DeviceDoesNotExistError
}