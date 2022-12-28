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
    permissionGroup: string;
    constructor(user: object, permissionGroup: string) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, email, address, profileImage, birthday} = user;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.phoneNumber = phoneNumber
        this.address = address ? address : new Address({})
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.birthday = birthday
        this.permissionGroup = permissionGroup
    }
}

export {UserConnectionResponse}