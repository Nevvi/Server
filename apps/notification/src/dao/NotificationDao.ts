'use strict'

import {
    NotificationGroupAlreadyExistsError,
    NotificationGroupDoesNotExistError,
    NotificationGroupSubscriberAlreadyExistsError,
    SubscriberDoesNotExistError
} from "../error/Errors";

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {fromDocument as fromGroupDocument, NotificationGroup} from "../model/NotificationGroup";
import {fromModel as fromGroupModel, NotificationGroupDocument} from "./NotificationGroupDocument";
import {fromDocument as fromSubscriberDocument, NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {fromModel as fromSubscriberModel, NotificationGroupSubscriberDocument} from "./NotificationGroupSubscriberDocument";
import {fromDocument as fromNotificationDocument, Notification} from "../model/Notification";
import {fromModel as fromNotificationModel, NotificationDocument} from "./NotificationDocument";

const AWS = require('aws-sdk')

class NotificationDao {
    private db: DocumentClient;
    private table: string;
    constructor() {
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.table = process.env.NOTIFICATION_TABLE!
    }

    async getNotificationGroup(userId: string, groupId: string): Promise<NotificationGroupDocument> {
        const result = await this.db.get({
            TableName: this.table,
            Key: {
                partitionKey: userId,
                sortKey: `GROUP^${groupId}`
            }
        }).promise()

        if (!result.Item) {
            throw new NotificationGroupDoesNotExistError(groupId)
        }

        return result.Item as NotificationGroupDocument
    }

    // Queries for ALL information related to a group (group, subscribers, messages, etc.) in 1 query
    async getNotificationGroupInfo(groupId: string): Promise<NotificationGroup> {
        const result = await this.db.query({
            TableName: this.table,
            IndexName: "GSI1",
            KeyConditionExpression: '#gsi1pk = :gsi1pk',
            ExpressionAttributeNames:{
                "#gsi1pk": "gsi1pk",
            },
            ExpressionAttributeValues: {
                ":gsi1pk": groupId
            }
        }).promise()

        const groupRow = (result.Items || []).find(i => i.sortKey.includes("GROUP^"))
        if (!result.Items?.length || !groupRow) {
            throw new NotificationGroupDoesNotExistError(groupId)
        }

        const group = fromGroupDocument(groupRow as NotificationGroupDocument)
        group.subscribers = result.Items.filter(i => i.sortKey.includes("SUBSCRIBER^")).map(r => fromSubscriberDocument(r as NotificationGroupSubscriberDocument))
        group.messages = result.Items.filter(i => i.sortKey.includes("MESSAGE^")).map(r => fromNotificationDocument(r as NotificationDocument))

        return group;
    }

    async getNotificationGroups(userId: string): Promise<NotificationGroupDocument[]> {
        const result = await this.db.query({
            TableName: this.table,
            KeyConditionExpression: '#partitionKey = :partitionKey and begins_with(#sortKey, :sortKey)',
            ExpressionAttributeNames:{
                "#partitionKey": "partitionKey",
                "#sortKey": 'sortKey'
            },
            ExpressionAttributeValues: {
                ":partitionKey": userId,
                ":sortKey": "GROUP^"
            }
        }).promise()

        return (result.Items || []).map(i => i as NotificationGroupDocument);
    }

    async createNotificationGroup(notificationGroup: NotificationGroup): Promise<NotificationGroupDocument> {
        const document: NotificationGroupDocument = fromGroupModel(notificationGroup)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_not_exists(gsi1pk) and attribute_not_exists(gsi1sk)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new NotificationGroupAlreadyExistsError(document.name)
            }
            throw e
        }

        return document
    }

    async updateNotificationGroup(notificationGroup: NotificationGroup): Promise<NotificationGroupDocument> {
        const document: NotificationGroupDocument = fromGroupModel(notificationGroup)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_exists(gsi1pk) and attribute_exists(gsi1sk)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new NotificationGroupAlreadyExistsError(document.name)
            }
            throw e
        }

        return document
    }

    async createNotificationGroupSubscriber(subscriber: NotificationGroupSubscriber): Promise<NotificationGroupSubscriberDocument> {
        const document: NotificationGroupSubscriberDocument = fromSubscriberModel(subscriber)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_not_exists(partitionKey) and attribute_not_exists(sortKey)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new NotificationGroupSubscriberAlreadyExistsError(document.phoneNumber)
            }
            throw e
        }

        return document
    }

    async getNotificationGroupSubscriber(groupOwnerId: string, groupId: string, phoneNumber: string): Promise<NotificationGroupSubscriberDocument> {
        const result = await this.db.get({
            TableName: this.table,
            Key: {
                partitionKey: groupOwnerId,
                sortKey: `SUBSCRIBER^${groupId}^${phoneNumber}`
            }
        }).promise()

        if (!result.Item) {
            throw new SubscriberDoesNotExistError(phoneNumber, groupId)
        }

        return result.Item as NotificationGroupSubscriberDocument
    }

    async deleteNotificationGroupSubscriber(groupOwnerId: string, groupId: string, phoneNumber: string) {
        await this.db.delete({
            TableName: this.table,
            Key: {
                partitionKey: groupOwnerId,
                sortKey: `SUBSCRIBER^${groupId}^${phoneNumber}`
            }
        }).promise()
    }

    async createNotification(notification: Notification): Promise<NotificationDocument> {
        const document: NotificationDocument = fromNotificationModel(notification)

        // Notifications don't really have any uniqueness so no need to check
        await this.db.put({
            TableName: this.table,
            Item: document,
        }).promise()

        return document
    }
}

export {NotificationDao}