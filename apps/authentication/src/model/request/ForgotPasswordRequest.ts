'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    email: Joi.string().email().required()
}

class ForgotPasswordRequest extends UserRequest {
    public email: string;
    constructor(email: string) {
        super(schema)
        this.email = email
    }
}

export {ForgotPasswordRequest};