'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.string().email(), // not always present
    emailConfirmed: Joi.boolean(), // not always present
    phoneNumber: Joi.string(), // not always present
    phoneNumberConfirmed: Joi.boolean(), // not always present
}

class UpdateContactRequest extends UserRequest {
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    constructor(email: string, emailConfirmed: boolean, phoneNumber: string, phoneNumberConfirmed: boolean) {
        super(updateSchema)
        this.email = email
        this.emailConfirmed = emailConfirmed
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed
    }
}

export {UpdateContactRequest}