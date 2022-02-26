'use strict'

// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {NotificationDocument} from "../dao/NotificationDocument";
import {NotificationGroup} from "./NotificationGroup";

class Notification {
    id: string
    groupOwnerId: string
    groupId: string
    message: string
    createDate: string
    constructor(id: string, groupOwnerId: string, groupId: string, message: string, createDate: string) {
        this.id = id
        this.groupOwnerId = groupOwnerId
        this.groupId = groupId
        this.message = message
        this.createDate = createDate
    }
}

function newNotification(group: NotificationGroup, message: string): Notification {
    return new Notification(
        uuidv4(),
        group.userId,
        group.id,
        message,
        new Date().toISOString()
    )
}

function fromDocument(document: NotificationDocument) : Notification {
    return new Notification(
        document.id,
        document.groupOwnerId,
        document.groupId,
        document.message,
        document.createDate
    )
}

export {Notification, newNotification, fromDocument}