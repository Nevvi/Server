'use strict'

import {Address} from "./Address";
import {PermissionGroup} from "./PermissionGroup";
import {DeviceSettings} from "./DeviceSettings";
import {DEFAULT_ALL_PERMISSION_GROUP_NAME, DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME} from "../Constants";

const DEFAULT_PERMISSION_GROUPS = [
    new PermissionGroup({name: DEFAULT_ALL_PERMISSION_GROUP_NAME, fields: []}),
    new PermissionGroup({name: DEFAULT_CONTACT_INFO_PERMISSION_GROUP_NAME, fields: ["email", "phoneNumber"]})
]

class User {
    id: any;
    firstName: any;
    lastName: any;
    bio: any;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    onboardingCompleted: boolean;
    deviceId: string;
    address: Address;
    mailingAddress: Address;
    deviceSettings: DeviceSettings;
    profileImage: string;
    birthday: string;
    permissionGroups: PermissionGroup[];
    blockedUsers: string[];
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
            onboardingCompleted,
            deviceId,
            email,
            emailConfirmed,
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

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.bio = bio
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.birthday = birthday
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true
        this.onboardingCompleted = onboardingCompleted === undefined ? true : onboardingCompleted
        this.deviceId = deviceId
        this.address = address ? new Address({...address}) : new Address({})
        this.mailingAddress = mailingAddress ? new Address({...mailingAddress}) : new Address({})
        this.deviceSettings = deviceSettings ? new DeviceSettings({...deviceSettings}) : new DeviceSettings({})
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.permissionGroups = permissionGroups && permissionGroups.length > 0 ? permissionGroups.map((pg: object) => new PermissionGroup({...pg})) : DEFAULT_PERMISSION_GROUPS
        this.blockedUsers = blockedUsers || []

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }

    toPlainObj(): object {
        return Object.assign({}, this);
    }

    addBlockedUser(userId: string) {
        const blockedUsers = new Set(this.blockedUsers)
        blockedUsers.add(userId)
        this.blockedUsers = Array.from(blockedUsers)
    }

    removeBlockedUser(userId: string) {
        const blockedUsers = new Set(this.blockedUsers)
        blockedUsers.delete(userId)
        this.blockedUsers = Array.from(blockedUsers)
    }

    didConnectionDataChange(other: User): boolean {
        return this.birthday !== other.birthday ||
            ((this.phoneNumber && this.phoneNumberConfirmed) !== (other.phoneNumber && other.phoneNumberConfirmed)) ||
            ((this.email && this.emailConfirmed) !== (other.email && other.emailConfirmed)) ||
            JSON.stringify(this.address) !== JSON.stringify(other.address) ||
            JSON.stringify(this.mailingAddress) !== JSON.stringify(other.mailingAddress)
    }
}

export {User}