'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";

// models
import {ConnectionRequest} from "../model/connection/ConnectionRequest";
import {RequestStatus} from "../model/connection/RequestStatus";
const ConnectionRequestDocument = require('./document/ConnectionRequestDocument.ts')
import {ConnectionRequestExistsError} from "../error/Errors";

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

    async createConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<ConnectionRequest> {
        const now = new Date().toISOString()
        const document = new ConnectionRequestDocument({
            requestingUserId,
            requestedUserId,
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