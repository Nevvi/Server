'use strict'

module.exports = class {
    userId: string;
    connectedUserId: string;
    permissionGroupName: string;
    inSync: boolean;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {userId, connectedUserId, permissionGroupName, inSync, createDate, updateDate, updateBy, createBy} = body;

        this.userId = userId
        this.connectedUserId = connectedUserId
        this.permissionGroupName = permissionGroupName
        this.inSync = inSync

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}