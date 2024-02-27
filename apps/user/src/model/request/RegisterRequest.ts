

'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    id: Joi.string().required(),
    phoneNumber: Joi.string().required(),
}

class RegisterRequest extends UserRequest {
    private id: string;
    private phoneNumber: string;
    constructor(id: string, phoneNumber: string) {
        super(registerSchema)
        this.id = id
        this.phoneNumber = phoneNumber
    }
}

export {RegisterRequest}