'use strict'

import {SNS} from "aws-sdk";
import {CreateTopicResponse, PublishResponse} from "aws-sdk/clients/sns";

const AWS = require('aws-sdk')

class NotificationSender {
    private sns: SNS
    constructor() {
        this.sns = new AWS.SNS({})
    }

    async createTopic(name: string, displayName: string): Promise<CreateTopicResponse> {
        return await this.sns.createTopic({
            Name: name,
            Attributes: {
                DisplayName: displayName
            }
        }).promise()
    }

    async sendMessage(phoneNumber: string, message: string): Promise<PublishResponse> {
        return await this.sns.publish({
            Message: message,
            PhoneNumber: phoneNumber
        }).promise()
    }
}

export {NotificationSender}