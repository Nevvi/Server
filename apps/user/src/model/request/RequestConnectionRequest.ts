'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const addConnectionSchema = {
    userId: Joi.string().uuid().required()
}

class RequestConnectionRequest extends UserRequest {
    userId: string;
    constructor(userId: string) {
        super(addConnectionSchema)
        this.userId = userId
    }
}

export {RequestConnectionRequest}