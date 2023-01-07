

'use strict'

const Joi = require('joi');
const JoiDate = require('@hapi/joi-date')
import {UserRequest} from './UserRequest';

const ExtendedJoi = Joi.extend(JoiDate)

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.string(), // not allowed via this endpoint
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    firstName: Joi.string(),
    lastName: Joi.string(),
    address: Joi.object().keys({
        street: Joi.string(),
        unit: Joi.string().allow(""),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.number()
    }),
    permissionGroups: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        fields: Joi.array().items(Joi.string()).required()
    })),
    birthday: ExtendedJoi.date().format('YYYY-MM-DD').raw(),
    onboardingCompleted: Joi.boolean()
}

class UpdateRequest extends UserRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: object;
    permissionGroups: object[];
    birthday: string;
    onboardingCompleted: boolean;
    constructor(firstName: string, lastName: string, phoneNumber: string, address: object, permissionGroups: object[], birthday: string, onboardingCompleted: boolean) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName
        this.phoneNumber = phoneNumber
        this.address = address
        this.permissionGroups = permissionGroups
        this.birthday = birthday
        this.onboardingCompleted = onboardingCompleted
    }
}

export {UpdateRequest}