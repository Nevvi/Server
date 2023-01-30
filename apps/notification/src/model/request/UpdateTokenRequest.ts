'use strict'

const Joi = require('joi');
import {Request} from './Request';

const schema = {
    userId: Joi.string().uuid().required(),
    token: Joi.string().required(),
}

class UpdateTokenRequest extends Request {
    userId: string;
    token: string;
    constructor(userId: string, token: string) {
        super(schema)
        this.userId = userId
        this.token = token
    }
}

export {UpdateTokenRequest}