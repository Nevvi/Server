'use strict'

const Joi = require('joi');
const JoiDate = require('@hapi/joi-date')
import {UserRequest} from './UserRequest';

const ExtendedJoi = Joi.extend(JoiDate)

const updateSchema = {
    id: Joi.forbidden(), // can't change this
    email: Joi.forbidden(), // not allowed via this endpoint
    emailConfirmed: Joi.forbidden(), // not allowed via this endpoint
    phoneNumber: Joi.string(),
    phoneNumberConfirmed: Joi.forbidden(), // not allowed via this endpoint
    firstName: Joi.string(),
    lastName: Joi.string(),
    address: Joi.object().keys({
        street: Joi.string().allow(null),
        unit: Joi.string().allow(null),
        city: Joi.string().allow(null),
        state: Joi.string().allow(null),
        zipCode: Joi.number().allow(null)
    }),
    permissionGroups: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        fields: Joi.array().items(Joi.string()).required()
    })),
    birthday: ExtendedJoi.date().format('YYYY-MM-DD').raw(),
    onboardingCompleted: Joi.boolean(),
    deviceId: Joi.string()
}

class UpdateRequest extends UserRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: object;
    permissionGroups: object[];
    birthday: string;
    onboardingCompleted: boolean;
    deviceId: string;

    constructor(firstName: string,
                lastName: string,
                phoneNumber: string,
                address: object,
                permissionGroups: object[],
                birthday: string,
                onboardingCompleted: boolean,
                deviceId: string) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName
        this.phoneNumber = phoneNumber
        this.address = address
        this.permissionGroups = permissionGroups
        this.birthday = birthday
        this.onboardingCompleted = onboardingCompleted
        this.deviceId = deviceId
    }
}

export {UpdateRequest}