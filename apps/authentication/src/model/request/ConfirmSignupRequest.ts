'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const registerSchema = {
    username: Joi.string().required(),
    confirmationCode: Joi.string().required()
}

class ConfirmSignupRequest extends UserRequest {
    public username: string;
    public confirmationCode: string;
    constructor(username: string, confirmationCode: string) {
        super(registerSchema)
        this.username = username
        this.confirmationCode = confirmationCode
    }
}

export {ConfirmSignupRequest}