'use strict'

const Joi = require('joi');
import {UserRequest} from './UserRequest';

const deleteSchema = {
    id: Joi.string().required()
}

class DeleteAccountRequest extends UserRequest {
    id: string;

    constructor(id: string) {
        super(deleteSchema)
        this.id = id
    }
}

export {DeleteAccountRequest}