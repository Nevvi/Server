'use strict'

import {NotificationGroup} from "../model/NotificationGroup";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {Notification} from "../model/Notification";

class NotificationGroupDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    id: string
    referenceCode: number
    userId: string
    name: string
    topicArn: string
    createDate: string
    constructor(id: string, referenceCode: number, userId: string, name: string, topicArn: string, createDate: string) {
        // need the uuid to be in the primary to make updates and queries easier
        // id is seeded from name so it will prevent duplicate names
        this.partitionKey = userId
        this.sortKey = `GROUP^${id}`

        this.gsi1pk = referenceCode.toString()
        this.gsi1sk = `GROUP^${id}`

        this.id = id
        this.referenceCode = referenceCode
        this.userId = userId
        this.name = name
        this.topicArn = topicArn
        this.createDate = createDate
    }
}

function fromModel(model: NotificationGroup) : NotificationGroupDocument {
    return new NotificationGroupDocument(
        model.id,
        model.referenceCode,
        model.userId,
        model.name,
        model.topicArn!,
        model.createDate
    )
}

export {NotificationGroupDocument, fromModel}