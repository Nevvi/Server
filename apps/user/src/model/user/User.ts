'use strict'

import {Address} from "./Address";
import {PermissionGroup} from "./PermissionGroup";

const DEFAULT_PERMISSION_GROUPS = [new PermissionGroup({name: "ALL", fields: []})]

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
    birthday: string;
    permissionGroups: PermissionGroup[];
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, phoneNumberConfirmed, email, emailConfirmed, address, permissionGroups, profileImage, birthday, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.birthday = birthday
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.address = address ? new Address({...address}) : new Address({})
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.permissionGroups = permissionGroups ? permissionGroups.map((pg: object) => new PermissionGroup({...pg})) : DEFAULT_PERMISSION_GROUPS

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