'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(), // assume this was already validated upstream
}

class RegisterRequest extends UserRequest {
    private id: string;
    private email: string;
    private phoneNumber: string;
    constructor(id: string, email: string, phoneNumber: string) {
        super(registerSchema)
        this.id = id
        this.email = email
        this.phoneNumber = phoneNumber
    }
}

export {RegisterRequest}