'use strict'

const Joi = require('joi');
const UserRequest = require('./UserRequest')

const logoutSchema = {
    accessToken: Joi.string().required(),
}

module.exports = class LoginRequest extends UserRequest {
    constructor(accessToken) {
        super(logoutSchema)
        this.accessToken = accessToken
    }
}