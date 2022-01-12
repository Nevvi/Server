'use strict'

const getUuid = require('uuid-by-string')
import {NotificationGroupDocument} from "../dao/NotificationGroupDocument";

class NotificationGroup {
    id: string
    userId: string
    name: string
    createDate: string;
    constructor(id: string, userId: string, name: string, createDate: string) {
        this.id = id
        this.userId = userId
        this.name = name
        this.createDate = createDate
    }
}

function newNotificationGroup(userId: string, name: string): NotificationGroup {
    const normalizedName = name.split(" ").join("").toUpperCase()
    return new NotificationGroup(
        getUuid(normalizedName),
        userId,
        name,
        new Date().toISOString()
    )
}

function fromDocument(document: NotificationGroupDocument) : NotificationGroup {
    return new NotificationGroup(
        document.id,
        document.userId,
        document.name,
        document.createDate
    )
}

export {NotificationGroup, fromDocument, newNotificationGroup}