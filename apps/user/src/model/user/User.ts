'use strict'

import {Address} from "./Address";
import {PermissionGroup} from "./PermissionGroup";

class User {
    id: any;
    firstName: any;
    lastName: any;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    address: Address;
    profileImage: string;
    permissionGroups: PermissionGroup[];
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, phoneNumberConfirmed, email, emailConfirmed, address, permissionGroups, profileImage, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.address = address ? new Address({...address}) : new Address({})
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.permissionGroups = permissionGroups ? permissionGroups.map((pg: object) => new PermissionGroup({...pg})) : []

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }

    toPlainObj(): object {
        return Object.assign({}, this);
    }
}

export {User}