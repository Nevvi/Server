'use strict'

import {Address} from "../../model/user/Address";
import {PermissionGroup} from "../../model/user/PermissionGroup";
import {DeviceSettings} from "../../model/user/DeviceSettings";

module.exports = class {
    _id: string;
    firstName: string;
    lastName: string;
    bio: string;
    nameLower: string | null;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    onboardingCompleted: boolean;
    deviceId: string;
    address: Address;
    mailingAddress: Address;
    deviceSettings: DeviceSettings;
    permissionGroups: PermissionGroup[];
    blockedUsers: string[]; // this would be better off in more of a SQL table since it can infinitely grow
    profileImage: string;
    birthday: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: any) {
        const {
            id,
            firstName,
            lastName,
            bio,
            phoneNumber,
            phoneNumberConfirmed,
            email,
            emailConfirmed,
            onboardingCompleted,
            deviceId,
            address,
            mailingAddress,
            deviceSettings,
            permissionGroups,
            blockedUsers,
            profileImage,
            birthday,
            createDate,
            updateDate,
            updateBy,
            createBy
        } = body;

        // dynamodb fields
        this._id = id

        // data fields
        this.firstName = firstName
        this.lastName = lastName
        this.nameLower = firstName && lastName ? [firstName, lastName].join('_').toLowerCase() : null
        this.bio = bio
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.onboardingCompleted = onboardingCompleted
        this.deviceId = deviceId
        this.address = address
        this.mailingAddress = mailingAddress
        this.deviceSettings = deviceSettings
        this.birthday = birthday
        this.profileImage = profileImage
        this.permissionGroups = permissionGroups
        this.blockedUsers = blockedUsers

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}