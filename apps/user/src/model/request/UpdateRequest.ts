'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    username: Joi.forbidden(), // can't change this
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