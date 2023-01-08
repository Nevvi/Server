

'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    name: Joi.string().required()
}

class CreateGroupRequest extends UserRequest {
    userId: string;
    name: string;
    constructor(userId: string, name: string) {
        super(schema)
        this.userId = userId
        this.name = name
    }
}

export {CreateGroupRequest}