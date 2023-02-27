'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    email: Joi.string().email().required(),
    code: Joi.string().required(),
    password: Joi.string().required()
}

class ResetPasswordRequest extends UserRequest {
    public email: string;
    public code: string;
    public password: string;
    constructor(email: string, code: string, password: string) {
        super(schema)
        this.email = email
        this.code = code
        this.password = password
    }
}

export {ResetPasswordRequest};