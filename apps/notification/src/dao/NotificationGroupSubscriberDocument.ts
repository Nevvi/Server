'use strict'

import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";

class NotificationGroupSubscriberDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    groupId: string
    groupOwnerId: string
    referenceCode: number
    phoneNumber: string
    subscriberArn: string
    createDate: string
    constructor(groupOwnerId: string, groupId: string, referenceCode: number, subscriberArn: string, phoneNumber: string, createDate: string) {
        // need the uuid to be in the primary to make updates and queries easier
        // id is seeded from name so it will prevent duplicate names
        this.partitionKey = groupOwnerId
        this.sortKey = `SUBSCRIBER^${groupId}^${phoneNumber}`

        this.gsi1pk = referenceCode.toString()
        this.gsi1sk = `SUBSCRIBER^${groupId}^${phoneNumber}`

        this.groupId = groupId
        this.groupOwnerId = groupOwnerId
        this.referenceCode = referenceCode
        this.phoneNumber = phoneNumber
        this.subscriberArn = subscriberArn
        this.createDate = createDate
    }
}

function fromModel(model: NotificationGroupSubscriber) : NotificationGroupSubscriberDocument {
    return new NotificationGroupSubscriberDocument(
        model.groupOwnerId,
        model.groupId,
        model.referenceCode,
        model.subscriberArn,
        model.phoneNumber,
        model.createDate
    )
}

export {NotificationGroupSubscriberDocument, fromModel}