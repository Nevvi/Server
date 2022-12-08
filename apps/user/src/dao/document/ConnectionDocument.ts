'use strict'

module.exports = class {
    userId: string;
    connectedUserId: string;
    permissionGroupName: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {userId, connectedUserId, permissionGroupName, createDate, updateDate, updateBy, createBy} = body;

        this.userId = userId
        this.connectedUserId = connectedUserId
        this.permissionGroupName = permissionGroupName


        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}