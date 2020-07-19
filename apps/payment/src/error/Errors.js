'use strict'

module.exports.InvalidRequestError = class extends Error {
    constructor(message) {
        super(message)
        this.statusCode = 400;
    }
}
