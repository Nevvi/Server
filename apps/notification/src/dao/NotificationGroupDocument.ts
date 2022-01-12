'use strict'

import {NotificationGroup} from "../model/NotificationGroup";

class NotificationGroupDocument {
    partitionKey: string
    sortKey: string
    id: string
    userId: string
    name: string
    createDate: string
    constructor(id: string, userId: string, name: string, createDate: string) {
        // need the uuid to be in the primary to make updates and queries easier
        // id is seeded from name so it will prevent duplicate names
        this.partitionKey = userId
        this.sortKey = `GROUP^${id}`

        this.id = id
        this.userId = userId
        this.name = name
        this.createDate = createDate
    }
}

function fromRow(row: any) : NotificationGroupDocument {
    return new NotificationGroupDocument(
        row.id,
        row.userId,
        row.name,
        row.createDate
    )
}

function fromModel(model: NotificationGroup) : NotificationGroupDocument {
    return new NotificationGroupDocument(
        model.id,
        model.userId,
        model.name,
        model.createDate
    )
}

export {NotificationGroupDocument, fromRow, fromModel}