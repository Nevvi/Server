'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(), // assume this was already validated upstream
}

class RegisterRequest extends UserRequest {
    private email: string;
    private phoneNumber: string;
    constructor(email: string, phoneNumber: string) {
        super(registerSchema)
        this.email = email
        this.phoneNumber = phoneNumber
    }
}

export {RegisterRequest}