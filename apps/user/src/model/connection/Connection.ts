'use strict'

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
        this.permissionGroupName = permissionGroupName || "ALL"
        this.inSync = inSync === true

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {Connection}