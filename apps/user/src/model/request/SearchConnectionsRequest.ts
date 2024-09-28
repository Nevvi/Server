'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const searchConnectionsSchema = {
    userId: Joi.string().uuid().required(),
    name: Joi.string().allow(),
    permissionGroup: Joi.string().allow(),
    inSync: Joi.boolean(),
    limit: Joi.number().min(1).max(25).required(),
    skip: Joi.number().min(0).required()
}

class SearchConnectionsRequest extends UserRequest {
    userId: string;
    name: string | undefined;
    permissionGroup: string | undefined;
    inSync: boolean | undefined;
    limit: number;
    skip: number;

    constructor(userId: string,
                name: string | undefined,
                permissionGroup: string | undefined,
                inSync: boolean | undefined,
                limit: number = 25,
                skip: number = 0) {
        super(searchConnectionsSchema)
        this.userId = userId
        this.name = name
        this.permissionGroup = permissionGroup
        this.inSync = inSync
        this.limit = limit
        this.skip = skip
    }
}

export {SearchConnectionsRequest}