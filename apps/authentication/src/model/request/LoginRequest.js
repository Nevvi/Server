'use strict'

const Joi = require('joi');
const UserRequest = require('./UserRequest')

const loginSchema = {
    username: Joi.string().required(),
    password: Joi.string().required()
}

module.exports = class LoginRequest extends UserRequest {
    constructor(body) {
        super(loginSchema)
        this.username = body.username
        this.password = body.password
    }
}