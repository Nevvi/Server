'use strict'

import {SQS} from "aws-sdk";

const AWS = require("aws-sdk")

class NotificationDao {
    private sqs: SQS
    private readonly notificationQueueUrl: string

    constructor() {
        this.sqs = new AWS.SQS()
        // @ts-ignore
        this.notificationQueueUrl = process.env.NOTIFICATION_QUEUE_URL
    }

    async sendNotification(userId: string, title: string, body: string) {
        const data = {
            userId,
            title,
            body
        }

        await this.sqs.sendMessage({
            QueueUrl: this.notificationQueueUrl,
            MessageBody: JSON.stringify(data)
        }).promise()
    }

}

export {NotificationDao}