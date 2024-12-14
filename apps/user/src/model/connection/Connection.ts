'use strict'

import {DEFAULT_ALL_PERMISSION_GROUP_NAME} from "../Constants";

class Connection {
    userId: string;
    profileImage: string | undefined;
    permissionGroupName: string;
    inSync: boolean;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {connectedUserId, permissionGroupName, inSync, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.userId = connectedUserId
        this.permissionGroupName = permissionGroupName || DEFAULT_ALL_PERMISSION_GROUP_NAME
        this.inSync = inSync === true

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {Connection}