'use strict'

const {InvalidRequestError} = require('../../error/Errors')
const Joi = require('joi');

module.exports = class Request {
    constructor(schema) {
        this.validationSchema = schema
    }

    validate() {
        const {error} = Joi.object().keys(this.validationSchema).validate(this, {convert: false, stripUnknown: true})
        if (error) {
            throw new InvalidRequestError(error.message)
        }
    }
}