'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.forbidden(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    firstName: Joi.string(),
    lastName: Joi.string()
}

class UpdateRequest extends UserRequest {
    firstName: string;
    lastName: string;
    constructor(firstName: string, lastName: string) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName
    }
}

export {UpdateRequest}