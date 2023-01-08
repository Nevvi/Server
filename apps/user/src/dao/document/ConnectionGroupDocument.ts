'use strict'

module.exports = class {
    _id: string;
    userId: string;
    name: string;
    connections: string[];
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {id, userId, name, connections, createDate, updateDate, updateBy, createBy} = body;

        this._id = id
        this.userId = userId
        this.name = name
        this.connections = connections

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}