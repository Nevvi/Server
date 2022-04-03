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
        super(`Notification group with id ${id} does not exist for user`, 404)
    }
}

class NotificationGroupAlreadyExistsError extends HttpStatusCodeError {
    constructor(name: string) {
        super(`Notification group already exists for this user with name: ${name}`, 409)
    }
}

class NotificationGroupSubscriberAlreadyExistsError extends HttpStatusCodeError {
    constructor(phoneNumber: string) {
        super(`Notification group subscriber already exists for this phone number: ${phoneNumber}`, 409)
    }
}

class SubscriberDoesNotExistError extends HttpStatusCodeError {
    constructor(phoneNumber: string, id: string) {
        super(`Subscriber with number ${phoneNumber} to group with id ${id} does not exist`, 404)
    }
}

class RateLimitError extends Error {
    constructor(phoneNumber: string, rateLimit: number) {
        super(`${phoneNumber} has sent more than the configured number of messages in the past ${rateLimit} minute(s)`)
    }
}

export {
    HttpStatusCodeError,
    InvalidRequestError,
    NotificationGroupDoesNotExistError,
    NotificationGroupAlreadyExistsError,
    NotificationGroupSubscriberAlreadyExistsError,
    SubscriberDoesNotExistError,
    RateLimitError
}