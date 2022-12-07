'use strict'

import {Address} from "../../model/user/Address";

module.exports = class {
    _id: string;
    firstName: string;
    lastName: string;
    nameLower: string | null;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    address: Address;
    profileImage: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, phoneNumberConfirmed, email, emailConfirmed, address, profileImage, createDate, updateDate, updateBy, createBy} = body;

        // dynamodb fields
        this._id = id

        // data fields
        this.firstName = firstName
        this.lastName = lastName
        this.nameLower = firstName && lastName ? [firstName, lastName].join('_').toLowerCase() : null
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.address = address
        this.profileImage = profileImage

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}