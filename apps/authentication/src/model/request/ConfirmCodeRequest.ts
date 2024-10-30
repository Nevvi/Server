'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const confirmCodeRequest = {
    accessToken: Joi.string().required(),
    attributeName: Joi.string().required(),
    code: Joi.string().required()
}

class ConfirmCodeRequest extends UserRequest {
    public accessToken: string;
    public attributeName: string;
    public code: string;
    constructor(accessToken: string, attributeName: string, code: string) {
        super(confirmCodeRequest)
        this.accessToken = accessToken
        this.attributeName = attributeName
        this.code = code.trim()
    }
}

export {ConfirmCodeRequest}