'use strict'

module.exports = class {
    userId: string;
    connectedUserId: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {userId, connectedUserId, createDate, updateDate, updateBy, createBy} = body;

        this.userId = userId

        // data fields
        this.connectedUserId = connectedUserId


        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}