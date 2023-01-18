'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    userId: Joi.string().uuid().required(),
    name: Joi.string().allow(),
    limit: Joi.number().min(1).max(25).required(),
    skip: Joi.number().min(0).required()
}

class SearchGroupsRequest extends UserRequest {
    userId: string;
    name: string | undefined;
    limit: number;
    skip: number;
    constructor(userId: string, name: string | undefined, limit: number = 10, skip: number = 0) {
        super(schema)
        this.userId = userId
        this.name = name
        this.limit = limit
        this.skip = skip
    }
}

export {SearchGroupsRequest}