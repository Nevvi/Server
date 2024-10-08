'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const searchSchema = {
    name: Joi.string().min(3),
    email: Joi.string().email(),
    phoneNumber: Joi.string(),
    phoneNumbers: Joi.any(),
    limit: Joi.number(),
    skip: Joi.number()
}

class SearchRequest extends UserRequest {
    name: string;
    email: string;
    phoneNumber: string;
    phoneNumbers: string[];
    limit: number;
    skip: number;

    constructor(name: string, email: string, phoneNumber: string, phoneNumbers: string[], limit: number = 10, skip: number = 0) {
        super(searchSchema)
        this.name = name
        this.email = email
        this.phoneNumber = phoneNumber
        this.phoneNumbers = phoneNumbers
        this.limit = limit;
        this.skip = skip;
    }
}

export {SearchRequest}