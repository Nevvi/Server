'use strict'

import {InvalidRequestError} from "../../error/Errors";

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
    firstName: Joi.string().allow(null),
    lastName: Joi.string().allow(null),
    address: Joi.object().keys({
        street: Joi.string().allow(null),
        unit: Joi.string().allow(null),
        city: Joi.string().allow(null),
        state: Joi.string().allow(null),
        zipCode: Joi.number().allow(null)
    }),
    deviceSettings: Joi.object().keys({
        autoSync: Joi.boolean().required(),
        syncAllInformation: Joi.boolean().required(),
    }),
    permissionGroups: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        fields: Joi.array().items(Joi.string()).required()
    })),
    birthday: ExtendedJoi.date().format('YYYY-MM-DD').raw(),
    onboardingCompleted: Joi.boolean(),
    deviceId: Joi.string().allow(null)
}

class UpdateRequest extends UserRequest {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: object;
    deviceSettings: object;
    permissionGroups: object[];
    birthday: string;
    onboardingCompleted: boolean;
    deviceId: string;

    constructor(firstName: string,
                lastName: string,
                phoneNumber: string,
                address: object,
                deviceSettings: object,
                permissionGroups: object[],
                birthday: string,
                onboardingCompleted: boolean,
                deviceId: string) {
        super(updateSchema)
        this.firstName = firstName
        this.lastName = lastName
        this.phoneNumber = phoneNumber
        this.address = address
        this.deviceSettings = deviceSettings
        this.permissionGroups = permissionGroups
        this.birthday = birthday
        this.onboardingCompleted = onboardingCompleted
        this.deviceId = deviceId
    }


    validate(body?: object) {
        super.validate(body);

        if (this.permissionGroups) {
            // @ts-ignore
            const permissionGroupNames = new Set(this.permissionGroups.map(pg => pg.name))
            if (permissionGroupNames.size != this.permissionGroups.length) {
                throw new InvalidRequestError("Permission groups cannot have the same name")
            }
        }
    }
}

export {UpdateRequest}