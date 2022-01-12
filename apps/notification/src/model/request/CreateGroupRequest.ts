'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const createGroupSchema = {
    userId: Joi.string().required(),
    name: Joi.string().required()
}

class CreateGroupRequest extends UserRequest {
    public userId: string;
    public name: string;
    constructor(userId: string, name: string) {
        super(createGroupSchema)
        this.userId = userId
        this.name = name
    }
}

export {CreateGroupRequest};