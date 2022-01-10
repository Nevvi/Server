'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    username: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.forbidden(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    name: Joi.string(),
}

class UpdateRequest extends UserRequest {
    name: string;
    constructor(name: string) {
        super(updateSchema)
        this.name = name
    }
}

export {UpdateRequest}