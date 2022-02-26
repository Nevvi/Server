'use strict'

const getUuid = require('uuid-by-string')
import {NotificationGroupDocument} from "../dao/NotificationGroupDocument";

class NotificationGroup {
    id: string
    userId: string
    name: string
    createDate: string
    expirationDate: string
    topicArn?: string

    subscribers: any
    messages: any
    constructor(id: string, userId: string, name: string, createDate: string, expirationDate: string) {
        this.id = id
        this.userId = userId
        this.name = name
        this.createDate = createDate
        this.expirationDate = expirationDate

        this.subscribers = []
        this.messages = []
    }
}

function newNotificationGroup(userId: string, name: string, expirationDate: string): NotificationGroup {
    const normalizedName = name.split(" ").join("").toUpperCase()
    return new NotificationGroup(
        getUuid(normalizedName).toUpperCase().slice(0, 6),
        userId,
        name,
        new Date().toISOString(),
        expirationDate
    )
}

function fromDocument(document: NotificationGroupDocument) : NotificationGroup {
    const group = new NotificationGroup(
        document.id,
        document.userId,
        document.name,
        document.createDate,
        document.expirationDate
    )
    group.topicArn = document.topicArn
    return group
}

export {NotificationGroup, fromDocument, newNotificationGroup}