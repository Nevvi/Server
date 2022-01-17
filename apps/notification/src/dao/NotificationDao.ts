'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {NotificationGroup} from "../model/NotificationGroup";
import {fromModel as fromGroupModel, fromRow as fromGroupRow, NotificationGroupDocument} from "./NotificationGroupDocument";
import {
    InvalidRequestError,
    NotificationGroupAlreadyExistsError,
    NotificationGroupDoesNotExistError, NotificationGroupSubscriberAlreadyExistsError
} from "../error/Errors";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {fromModel as fromSubscriberModel, NotificationGroupSubscriberDocument} from "./NotificationGroupSubscriberDocument";

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

        return fromGroupRow(result.Item)
    }

    async getNotificationGroupByCode(referenceCode: number): Promise<NotificationGroupDocument> {
        const result = await this.db.query({
            TableName: this.table,
            IndexName: "GSI1",
            KeyConditionExpression: '#gsi1pk = :gsi1pk and begins_with(#gsi1sk, :gsi1sk)',
            ExpressionAttributeNames:{
                "#gsi1pk": "gsi1pk",
                "#gsi1sk": 'gsi1sk'
            },
            ExpressionAttributeValues: {
                ":gsi1pk": referenceCode.toString(),
                ":gsi1sk": "GROUP^"
            }
        }).promise()

        if (!result.Items?.length) {
            throw new NotificationGroupDoesNotExistError(referenceCode.toString())
        } else if (result.Items.length > 1) {
            throw new InvalidRequestError(`Found too many groups for code ${referenceCode}`)
        }

        return fromGroupRow(result.Items[0]);
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

        return (result.Items || []).map(i => fromGroupRow(i));
    }

    async createNotificationGroup(notificationGroup: NotificationGroup): Promise<NotificationGroupDocument> {
        const document: NotificationGroupDocument = fromGroupModel(notificationGroup)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_not_exists(partitionKey) and attribute_not_exists(sortKey)'
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
}

export {NotificationDao}