'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    username: Joi.string().required(),
    code: Joi.string().required(),
    password: Joi.string().required()
}

class ResetPasswordRequest extends UserRequest {
    public username: string;
    public code: string;
    public password: string;
    constructor(username: string, code: string, password: string) {
        super(schema)
        this.username = username
        this.code = code
        this.password = password
    }
}

export {ResetPasswordRequest};