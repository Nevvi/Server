'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";

// models
import {ConnectionRequest} from "../model/connection/ConnectionRequest";
import {RequestStatus} from "../model/connection/RequestStatus";
const ConnectionRequestDocument = require('./document/ConnectionRequestDocument.ts')
import {ConnectionRequestDoesNotExistError, ConnectionRequestExistsError} from "../error/Errors";

const AWS = require('aws-sdk')

class ConnectionDao {
    private db: DocumentClient;
    private table: string;

    constructor() {
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.table = process.env.USER_TABLE || ""
    }

    async getConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<ConnectionRequest | null> {
        const result = await this.db.get({
            TableName: this.table,
            Key: {
                partitionKey: requestingUserId,
                sortKey: `CONNECTION_REQUEST^${requestedUserId}`
            }
        }).promise()

        const document = result && result.Item
        return document ? new ConnectionRequest(document) : null
    }

    async getConnectionRequests(requestedUserId: string, status: RequestStatus): Promise<ConnectionRequest[]> {
        const result = await this.db.query({
            TableName: this.table,
            IndexName: 'GSI1',
            KeyConditionExpression: 'gsi1pk = :gsi1pk and begins_with(gsi1sk, :gsi1sk)',
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':gsi1pk': requestedUserId,
                ':gsi1sk': 'CONNECTION_REQUEST^',
                ':status': status
            }
        }).promise()

        return (result.Items || []).map(i => new ConnectionRequest(i))
    }

    async createConnectionRequest(requestingUserId: string, requestedUserId: string, requesterImage: string, requestText: string): Promise<ConnectionRequest> {
        const now = new Date().toISOString()
        const document = new ConnectionRequestDocument({
            requestingUserId,
            requestedUserId,
            requesterImage,
            requestText,
            status: RequestStatus.PENDING,
            createDate: now,
            createBy: 'HARDCODED_FOR_NOW',
            updateDate: now,
            updateBy: 'HARDCODED_FOR_NOW'
        })

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_not_exists(partitionKey) and attribute_not_exists(sortKey)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new ConnectionRequestExistsError()
            }
            throw e
        }

        return new ConnectionRequest(document)
    }

    async updateConnectionRequest(request: ConnectionRequest): Promise<ConnectionRequest> {
        request.updateDate = new Date().toISOString()
        request.updateBy = 'HARDCODED_FOR_NOW'

        const document = new ConnectionRequestDocument(request)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new ConnectionRequestDoesNotExistError()
            }
            throw e
        }

        return request
    }

    async deleteConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<boolean | null> {
        const result = await this.db.delete({
            TableName: this.table,
            Key: {
                partitionKey: requestingUserId,
                sortKey: `CONNECTION_REQUEST^${requestedUserId}`
            }
        }).promise()

        return result && result.Attributes !== null
    }
}

export {ConnectionDao}