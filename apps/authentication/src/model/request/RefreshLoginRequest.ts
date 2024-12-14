'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const refreshLoginSchema = {
    refreshToken: Joi.string().required()
}

class RefreshLoginRequest extends UserRequest {
    public refreshToken: string;
    constructor(refreshToken: string) {
        super(refreshLoginSchema)
        this.refreshToken = refreshToken
    }
}

export {RefreshLoginRequest};