'use strict'

import {InvalidRequestError} from "../../error/Errors";

const Joi = require('joi');

import {UserRequest} from './UserRequest';
import dayjs from "dayjs";

const createGroupSchema = {
    userId: Joi.string().required(),
    name: Joi.string().required(),
    expirationDate: Joi.string().regex(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/).required()
}

class CreateGroupRequest extends UserRequest {
    public userId: string;
    public name: string;
    public expirationDate: string;
    constructor(userId: string, name: string, expirationDate: string) {
        super(createGroupSchema)
        this.userId = userId
        this.name = name
        this.expirationDate = expirationDate ? expirationDate : dayjs().format("YYYY-MM-DD")
    }


    validate() {
        super.validate();
        if (dayjs(this.expirationDate, "YYYY-MM-DD").isBefore(dayjs().startOf("day"))) {
            throw new InvalidRequestError("Expiration date cannot be in the past for a new group")
        }
    }
}

export {CreateGroupRequest};