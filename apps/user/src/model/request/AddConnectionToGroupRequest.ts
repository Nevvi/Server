'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const schema = {
    userId: Joi.string().required(),
    groupId: Joi.string().required(),
    connectedUserId: Joi.string().required()
}

class AddConnectionToGroupRequest extends UserRequest {
    userId: string;
    groupId: string;
    connectedUserId: string;

    constructor(userId: string, groupId: string, connectedUserId: string) {
        super(schema)
        this.userId = userId
        this.groupId = groupId
        this.connectedUserId = connectedUserId
    }
}

export {AddConnectionToGroupRequest}