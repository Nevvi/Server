'use strict'

import {NotificationGroup} from "../model/NotificationGroup";

class NotificationGroupDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    id: string
    userId: string
    name: string
    topicArn: string
    createDate: string
    constructor(id: string, userId: string, name: string, topicArn: string, createDate: string) {
        // need the uuid to be in the primary to make updates and queries easier
        // id is seeded from name so it will prevent duplicate names
        this.partitionKey = userId
        this.sortKey = `GROUP^${id}`

        this.gsi1pk = id
        this.gsi1sk = `GROUP^${id}`

        this.id = id
        this.userId = userId
        this.name = name
        this.topicArn = topicArn
        this.createDate = createDate
    }
}

function fromModel(model: NotificationGroup) : NotificationGroupDocument {
    return new NotificationGroupDocument(
        model.id,
        model.userId,
        model.name,
        model.topicArn!,
        model.createDate
    )
}

export {NotificationGroupDocument, fromModel}