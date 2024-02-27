'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    username: Joi.forbidden(), // can't change this
    email: Joi.string().email(),
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.forbidden(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
}

class UpdateRequest extends UserRequest {
    email: string;
    constructor(email: string) {
        super(updateSchema)
        this.email = email
    }
}

export {UpdateRequest}