'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    username: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.string(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    name: Joi.string(),
}

class UpdateRequest extends UserRequest {
    phoneNumber: string;
    name: string;
    constructor(phoneNumber: string, name: string) {
        super(updateSchema)
        this.phoneNumber = phoneNumber
        this.name = name
    }
}

export {UpdateRequest}