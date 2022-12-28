'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateConnectionSchema = {
    userId: Joi.string().uuid().required(),
    otherUserId: Joi.string().uuid().required(),
    permissionGroupName: Joi.string().required()
}

class UpdateConnectionRequest extends UserRequest {
    userId: string;
    otherUserId: string;
    permissionGroupName: string;
    constructor(userId: string, otherUserId: string, permissionGroupName: string) {
        super(updateConnectionSchema)
        this.userId = userId
        this.otherUserId = otherUserId
        this.permissionGroupName = permissionGroupName
    }
}

export {UpdateConnectionRequest}