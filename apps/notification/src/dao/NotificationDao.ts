'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {NotificationGroup} from "../model/NotificationGroup";
import {fromModel, fromRow, NotificationGroupDocument} from "./NotificationGroupDocument";
import {NotificationGroupAlreadyExistsError, NotificationGroupDoesNotExistError} from "../error/Errors";

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

        return fromRow(result.Item)
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

        return (result.Items || []).map(i => fromRow(i));
    }

    async createNotificationGroup(notificationGroup: NotificationGroup): Promise<NotificationGroupDocument> {
        const document: NotificationGroupDocument = fromModel(notificationGroup)

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
}

export {NotificationDao}