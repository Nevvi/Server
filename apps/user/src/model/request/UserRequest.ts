'use strict'

import {InvalidRequestError} from '../../error/Errors';
const Joi = require('joi');

class UserRequest {
    private validationSchema: object;
    constructor(schema: object) {
        this.validationSchema = schema
    }

    validate(body?: object) {
        const {error} = Joi.object().keys(this.validationSchema).validate(body ? body : this, {convert: true, stripUnknown: true})
        if (error) {
            throw new InvalidRequestError(error.message)
        }
    }
}

export {UserRequest}