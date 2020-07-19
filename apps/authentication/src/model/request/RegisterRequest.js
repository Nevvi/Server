'use strict'

const Joi = require('joi');
const UserRequest = require('./UserRequest')

const registerSchema = {
    username: Joi.string().required(),
    password: Joi.string().required()
}

module.exports = class RegisterRequest extends UserRequest {
    constructor(body) {
        super(registerSchema)
        this.username = body.username
        this.password = body.password
    }
}