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


export {
    InvalidRequestError,
    DeviceAlreadyExistsError
}