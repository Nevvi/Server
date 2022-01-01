'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    username: Joi.string().required() // maps to cognito username
}

class RegisterRequest extends UserRequest {
    private username: string;
    constructor(username: string) {
        super(registerSchema)
        this.username = username
    }
}

export {RegisterRequest}