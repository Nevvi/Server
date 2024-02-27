'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    username: Joi.string().required()
}

class ForgotPasswordRequest extends UserRequest {
    public username: string;
    constructor(username: string) {
        super(schema)
        this.username = username
    }
}

export {ForgotPasswordRequest};