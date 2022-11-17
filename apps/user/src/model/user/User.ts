'use strict'

import {Address} from "./Address";

class User {
    id: any;
    firstName: any;
    lastName: any;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    address: Address;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, phoneNumberConfirmed, email, emailConfirmed, address, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.address = address ? address : new Address({})

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {User}