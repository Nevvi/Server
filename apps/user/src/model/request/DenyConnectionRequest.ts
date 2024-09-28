'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const denyConnectionSchema = {
    userId: Joi.string().uuid().required(),
    otherUserId: Joi.string().uuid().required()
}

class DenyConnectionRequest extends UserRequest {
    userId: string;
    otherUserId: string;

    constructor(userId: string, otherUserId: string) {
        super(denyConnectionSchema)
        this.userId = userId
        this.otherUserId = otherUserId
    }
}

export {DenyConnectionRequest}