'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const sendCodeSchema = {
    accessToken: Joi.string().required(),
    attributeName: Joi.string().required()
}

class SendCodeRequest extends UserRequest {
    public accessToken: string;
    public attributeName: string;
    constructor(accessToken: string, attributeName: string) {
        super(sendCodeSchema)
        this.accessToken = accessToken
        this.attributeName = attributeName
    }
}

export {SendCodeRequest}