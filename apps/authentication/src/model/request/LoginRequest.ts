'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const loginSchema = {
    username: Joi.string().required(),
    password: Joi.string().required()
}

class LoginRequest extends UserRequest {
    public username: string;
    public password: string;
    constructor(username: string, password: string) {
        super(loginSchema)
        this.username = username
        this.password = password
    }
}

export {LoginRequest};