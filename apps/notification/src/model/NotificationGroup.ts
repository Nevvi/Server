'use strict'

const getUuid = require('uuid-by-string')
import {NotificationGroupDocument} from "../dao/NotificationGroupDocument";

class NotificationGroup {
    id: string
    referenceCode: number
    userId: string
    name: string
    createDate: string
    topicArn?: string

    subscribers: any
    messages: any
    constructor(id: string, referenceCode: number, userId: string, name: string, createDate: string) {
        this.id = id
        this.referenceCode = referenceCode
        this.userId = userId
        this.name = name
        this.createDate = createDate

        this.subscribers = []
        this.messages = []
    }
}

function newNotificationGroup(userId: string, name: string): NotificationGroup {
    const normalizedName = name.split(" ").join("").toUpperCase()
    return new NotificationGroup(
        getUuid(normalizedName),
        Math.floor(Math.random() * 90000) + 10000,
        userId,
        name,
        new Date().toISOString()
    )
}

function fromDocument(document: NotificationGroupDocument) : NotificationGroup {
    const group = new NotificationGroup(
        document.id,
        document.referenceCode,
        document.userId,
        document.name,
        document.createDate
    )
    group.topicArn = document.topicArn
    return group
}

export {NotificationGroup, fromDocument, newNotificationGroup}