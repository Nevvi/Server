'use strict'

class InvalidRequestError extends Error {
    statusCode: number;
    constructor(message: string) {
        super(message)
        this.statusCode = 400;
    }
}

export {InvalidRequestError}
