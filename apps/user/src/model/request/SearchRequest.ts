'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    name: Joi.string().min(3),
    limit: Joi.number()
}

class SearchRequest extends UserRequest {
    name: string;
    limit: number;
    constructor(name: string, limit: number = 10) {
        super(updateSchema)
        this.name = name
        this.limit = limit;
    }
}

export {SearchRequest}