'use strict'

import {NotificationGroupSubscriberDocument} from "../dao/NotificationGroupSubscriberDocument";

class NotificationGroupSubscriber {
    groupOwnerId: string
    groupId: string
    subscriberArn: string
    phoneNumber: string
    createDate: string
    constructor(groupOwnerId: string, groupId: string, subscriberArn: string, phoneNumber: string, createDate: string) {
        this.groupOwnerId = groupOwnerId
        this.groupId = groupId
        this.subscriberArn = subscriberArn
        this.phoneNumber = phoneNumber
        this.createDate = createDate
    }
}

function fromDocument(document: NotificationGroupSubscriberDocument) : NotificationGroupSubscriber {
    return new NotificationGroupSubscriber(
        document.groupOwnerId,
        document.groupId,
        document.subscriberArn,
        document.phoneNumber,
        document.createDate
    )
}

export {NotificationGroupSubscriber, fromDocument}