'use strict'

import {Notification} from "../model/Notification";

class NotificationDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    id: string
    groupId: string
    groupOwnerId: string
    referenceCode: number
    message: string
    createDate: string
    constructor(id: string, groupOwnerId: string, groupId: string, referenceCode: number, message: string, createDate: string) {
        this.partitionKey = groupOwnerId
        this.sortKey = `MESSAGE^${id}`

        this.gsi1pk = referenceCode.toString()
        this.gsi1sk = `MESSAGE^${id}`

        this.id = id
        this.groupId = groupId
        this.groupOwnerId = groupOwnerId
        this.referenceCode = referenceCode
        this.message = message
        this.createDate = createDate
    }
}

function fromModel(model: Notification) : NotificationDocument {
    return new NotificationDocument(
        model.id,
        model.groupOwnerId,
        model.groupId,
        model.referenceCode,
        model.message,
        model.createDate
    )
}

export {NotificationDocument, fromModel}