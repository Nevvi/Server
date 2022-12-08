'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const addConnectionSchema = {
    requestingUserId: Joi.string().uuid().required(),
    requestedUserId: Joi.string().uuid().required(),
    permissionGroupName: Joi.string().required()
}

class RequestConnectionRequest extends UserRequest {
    requestingUserId: string;
    requestedUserId: string
    permissionGroupName: string
    constructor(requestingUserId: string, requestedUserId: string, permissionGroupName: string) {
        super(addConnectionSchema)
        this.requestingUserId = requestingUserId
        this.requestedUserId = requestedUserId
        this.permissionGroupName = permissionGroupName
    }
}

export {RequestConnectionRequest}