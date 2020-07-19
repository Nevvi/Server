'use strict'

const Joi = require('joi');
const UserRequest = require('./UserRequest')

const updateSchema = {
    username: Joi.forbidden(), // can't change this
    firstName: Joi.string(),
    lastName: Joi.string()
}

module.exports = class UpdateRequest extends UserRequest {
    constructor(body) {
        super(updateSchema)
        this.firstName = body.firstName
        this.lastName = body.lastName
    }
}