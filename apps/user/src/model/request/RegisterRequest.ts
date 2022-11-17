

'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    id: Joi.string().required(),
    email: Joi.string().email().required(),
}

class RegisterRequest extends UserRequest {
    private id: string;
    private email: string;
    constructor(id: string, email: string) {
        super(registerSchema)
        this.id = id
        this.email = email
    }
}

export {RegisterRequest}