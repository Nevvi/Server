'use strict'

const Joi = require('joi');
const UserRequest = require('./UserRequest')

const registerSchema = {
    username: Joi.string().required() // maps to cognito username
}

module.exports = class RegisterRequest extends UserRequest {
    constructor(body) {
        super(registerSchema)
        this.username = body.username
    }
}