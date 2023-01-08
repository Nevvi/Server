'use strict'

class ConnectionGroup {
    id: string;
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

        // data fields
        this.id = id
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

export {ConnectionGroup}