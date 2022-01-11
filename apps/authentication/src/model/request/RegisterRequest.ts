'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    email: Joi.string().email().required(),
    password: Joi.string().required()
}

class RegisterRequest extends UserRequest {
    public email: string;
    public password: string;
    constructor(email: string, password: string) {
        super(registerSchema)
        this.email = email
        this.password = password
    }
}

export {RegisterRequest};