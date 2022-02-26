'use strict'

import {NotificationGroup} from "../model/NotificationGroup";

class NotificationGroupDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    gsi2pk: string
    gsi2sk: string

    id: string
    userId: string
    name: string
    topicArn: string
    createDate: string
    expirationDate: string
    constructor(id: string, userId: string, name: string, topicArn: string, createDate: string, expirationDate: string) {
        // id is seeded from name so it will prevent duplicate names
        this.partitionKey = userId
        this.sortKey = `GROUP^${id}`

        this.gsi1pk = id
        this.gsi1sk = `GROUP^${id}`

        // Used to expire group
        this.gsi2pk = 'GROUP'
        this.gsi2sk = expirationDate

        this.id = id
        this.userId = userId
        this.name = name
        this.topicArn = topicArn
        this.createDate = createDate
        this.expirationDate = expirationDate
    }
}

function fromModel(model: NotificationGroup) : NotificationGroupDocument {
    return new NotificationGroupDocument(
        model.id,
        model.userId,
        model.name,
        model.topicArn!,
        model.createDate,
        model.expirationDate
    )
}

export {NotificationGroupDocument, fromModel}