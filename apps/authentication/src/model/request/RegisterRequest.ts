'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(), // leave validation to cognito
    password: Joi.string().required()
}

class RegisterRequest extends UserRequest {
    public email: string;
    public phoneNumber: string;
    public password: string;
    constructor(email: string, phoneNumber: string, password: string) {
        super(registerSchema)
        this.email = email
        this.phoneNumber = phoneNumber
        this.password = password
    }
}

export {RegisterRequest};