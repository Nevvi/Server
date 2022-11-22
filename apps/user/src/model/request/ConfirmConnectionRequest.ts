'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const addConnectionSchema = {
    otherUserId: Joi.string().uuid().required()
}

class ConfirmConnectionRequest extends UserRequest {
    otherUserId: string;
    constructor(otherUserId: string) {
        super(addConnectionSchema)
        this.otherUserId = otherUserId
    }
}

export {ConfirmConnectionRequest}