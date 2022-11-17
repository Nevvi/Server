'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    username: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.string(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
}

class UpdateRequest extends UserRequest {
    phoneNumber: string;
    constructor(phoneNumber: string) {
        super(updateSchema)
        this.phoneNumber = phoneNumber
    }
}

export {UpdateRequest}