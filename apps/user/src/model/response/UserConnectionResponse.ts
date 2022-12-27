'use strict'

import {Address} from "../user/Address";

class UserConnectionResponse {
    id: any;
    firstName: any;
    lastName: any;
    email: string;
    phoneNumber: string;
    address: Address;
    profileImage: string;
    birthday: string;
    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, email, address, profileImage, birthday} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.phoneNumber = phoneNumber
        this.address = address ? address : new Address({})
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.birthday = birthday
    }
}

export {UserConnectionResponse}