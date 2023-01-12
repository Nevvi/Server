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

class AlreadyConnectedError extends Error {
    private statusCode: number;

    constructor() {
        super(`Users are already connected`)
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

class ConnectionExistsError extends Error {
    private statusCode: number;

    constructor() {
        super(`Connection already exists to this user`)
        this.statusCode = 409;
    }
}

class ConnectionDoesNotExistError extends Error {
    private statusCode: number;

    constructor() {
        super(`Connection does not exist`)
        this.statusCode = 404;
    }
}

class ConnectionGroupExistsError extends Error {
    private statusCode: number;

    constructor(name: string) {
        super(`Group already exists for this user with this name: ${name}`)
        this.statusCode = 409;
    }
}

class GroupDoesNotExistError extends Error {
    private statusCode: number;

    constructor(id: string) {
        super(`Group does not exist for this user with this id: ${id}`)
        this.statusCode = 404;
    }
}

class UserAlreadyInGroupError extends Error {
    private statusCode: number;

    constructor() {
        super(`User already a member of this group`)
        this.statusCode = 400;
    }
}

class UserNotInGroupError extends Error {
    private statusCode: number;

    constructor() {
        super(`User not a member of this group`)
        this.statusCode = 400;
    }
}


export {
    InvalidRequestError,
    UserNotFoundError,
    UserAlreadyExistsError,
    ConnectionRequestExistsError,
    ConnectionRequestDoesNotExistError,
    AlreadyConnectedError,
    ConnectionExistsError,
    ConnectionDoesNotExistError,
    ConnectionGroupExistsError,
    GroupDoesNotExistError,
    UserAlreadyInGroupError,
    UserNotInGroupError
}