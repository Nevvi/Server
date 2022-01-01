'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const logoutSchema = {
    accessToken: Joi.string().required(),
}

class LogoutRequest extends UserRequest {
    public accessToken: string;
    constructor(accessToken: string) {
        super(logoutSchema)
        this.accessToken = accessToken
    }
}

export {LogoutRequest}