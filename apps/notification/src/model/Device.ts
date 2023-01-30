'use strict'

class Device {
    userId: string;
    token: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {userId, token, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.userId = userId
        this.token = token

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {Device}