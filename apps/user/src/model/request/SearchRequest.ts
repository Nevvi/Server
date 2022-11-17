'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateSchema = {
    firstName: Joi.string(),
    lastName: Joi.string(),
}

class SearchRequest extends UserRequest {
    firstName: string;
    lastName: string;
    limit: number;
    constructor(firstName: string, lastName: string) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName

        // TODO - make this client driven
        this.limit = 10;
    }
}

export {SearchRequest}