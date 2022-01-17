'use strict'

import {SNS} from "aws-sdk";
import {CreateTopicResponse, PublishResponse, SubscribeResponse} from "aws-sdk/clients/sns";

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

    async createSubscription(topic: string, phoneNumber: string): Promise<SubscribeResponse> {
        return await this.sns.subscribe({
            TopicArn: topic,
            Protocol: "sms",
            Endpoint: phoneNumber
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