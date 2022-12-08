'use strict'

class Connection {
    userId: string;
    firstName: string | undefined;
    lastName: string | undefined;
    profileImage: string | undefined;
    permissionGroupName: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {connectedUserId, permissionGroupName, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.userId = connectedUserId
        this.permissionGroupName = permissionGroupName || "ALL"

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {Connection}