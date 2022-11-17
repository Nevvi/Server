

'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.string(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    firstName: Joi.string(),
    lastName: Joi.string(),
    address: Joi.object().keys({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.number()
    })
}

class UpdateRequest extends UserRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: object;
    constructor(firstName: string, lastName: string, phoneNumber: string, address: object) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName
        this.phoneNumber = phoneNumber
        this.address = address
    }
}

export {UpdateRequest}