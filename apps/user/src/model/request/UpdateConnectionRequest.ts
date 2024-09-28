'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const updateConnectionSchema = {
    userId: Joi.string().uuid().required(),
    otherUserId: Joi.string().uuid().required(),
    permissionGroupName: Joi.string(),
    inSync: Joi.boolean()
}

class UpdateConnectionRequest extends UserRequest {
    userId: string;
    otherUserId: string;
    permissionGroupName: string | undefined;
    inSync: boolean | undefined;

    constructor(userId: string, otherUserId: string, permissionGroupName: string | undefined, inSync: boolean | undefined) {
        super(updateConnectionSchema)
        this.userId = userId
        this.otherUserId = otherUserId
        this.permissionGroupName = permissionGroupName
        this.inSync = inSync
    }
}

export {UpdateConnectionRequest}