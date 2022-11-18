'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    name: Joi.string().min(3),
    email: Joi.string().email(),
    phoneNumber: Joi.string(),
    limit: Joi.number()
}

class SearchRequest extends UserRequest {
    name: string;
    email: string;
    phoneNumber: string;
    limit: number;
    constructor(name: string, email: string, phoneNumber: string, limit: number = 10) {
        super(updateSchema)
        this.name = name
        this.email = email
        this.phoneNumber = phoneNumber
        this.limit = limit;
    }
}

export {SearchRequest}