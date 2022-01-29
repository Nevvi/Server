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
        try {
            return await this.sns.createTopic({
                Name: name,
                Attributes: {
                    DisplayName: displayName
                }
            }).promise()
        } catch (e: any) {
            console.log(JSON.stringify(e))
            throw e
        }
    }

    async deleteTopic(topicArn: string) {
        return await this.sns.deleteTopic({
            TopicArn: topicArn
        }).promise()
    }

    async createSubscription(topic: string, phoneNumber: string): Promise<SubscribeResponse> {
        return await this.sns.subscribe({
            TopicArn: topic,
            Protocol: "sms",
            Endpoint: phoneNumber
        }).promise()
    }

    async deleteSubscription(subscriptionArn: string) {
        await this.sns.unsubscribe({
            SubscriptionArn: subscriptionArn
        }).promise()
    }

    async broadcastMessage(topicArn: string, message: string): Promise<PublishResponse> {
        return await this.sns.publish({
            Message: message,
            TopicArn: topicArn
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