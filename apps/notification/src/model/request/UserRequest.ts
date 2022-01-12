'use strict'

import {InvalidRequestError} from "../../error/Errors";
const Joi = require('joi');

class UserRequest {
    private validationSchema: any;
    constructor(schema: object) {
        this.validationSchema = schema
    }

    validate() {
        const {error} = Joi.object().keys(this.validationSchema).validate(this, {convert: false, stripUnknown: true})
        if (error) {
            throw new InvalidRequestError(error.message)
        }
    }
}

export {UserRequest}