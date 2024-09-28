'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const blockConnectionSchema = {
    userId: Joi.string().uuid().required(),
    otherUserId: Joi.string().uuid().required()
}

class BlockConnectionRequest extends UserRequest {
    userId: string;
    otherUserId: string;

    constructor(userId: string, otherUserId: string) {
        super(blockConnectionSchema)
        this.userId = userId
        this.otherUserId = otherUserId
    }
}

export {BlockConnectionRequest}