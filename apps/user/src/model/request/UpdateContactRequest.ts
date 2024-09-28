'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.string().email(), // not always present
    emailConfirmed: Joi.boolean(), // not always present
    phoneNumber: Joi.forbidden(), // cannot update via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // cannot update via this endpoint
}

class UpdateContactRequest extends UserRequest {
    email: string;
    emailConfirmed: boolean;

    constructor(email: string, emailConfirmed: boolean) {
        super(updateSchema)
        this.email = email
        this.emailConfirmed = emailConfirmed
    }
}

export {UpdateContactRequest}