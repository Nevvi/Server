'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    username: Joi.string().required(),
    password: Joi.string().required()
}

class RegisterRequest extends UserRequest {
    public username: string;
    public password: string;
    constructor(username: string, password: string) {
        super(registerSchema)
        this.username = username
        this.password = password
    }
}

export {RegisterRequest};