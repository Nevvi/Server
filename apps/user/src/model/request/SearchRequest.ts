'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const searchSchema = {
    name: Joi.string().min(3),
    email: Joi.string().email(),
    phoneNumber: Joi.string(),
    limit: Joi.number(),
    continuationKey: Joi.string()
}

class SearchRequest extends UserRequest {
    name: string;
    email: string;
    phoneNumber: string;
    limit: number;
    continuationKey: string | undefined;
    constructor(name: string, email: string, phoneNumber: string, limit: number = 10, continuationKey: string | undefined) {
        super(searchSchema)
        this.name = name
        this.email = email
        this.phoneNumber = phoneNumber
        this.limit = limit;
        this.continuationKey = continuationKey;
    }
}

export {SearchRequest}