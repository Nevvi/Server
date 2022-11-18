'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';
import {SearchRequest} from "../model/request/SearchRequest";
import {SearchResponse} from "../model/response/SearchResponse";

const {UserAlreadyExistsError, UserNotFoundError} = require('../error/Errors.ts')
const AWS = require('aws-sdk')

class UserDao {
    private db: DocumentClient;
    private table: string;

    constructor() {
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.table = process.env.USER_TABLE || ""
    }

    async getUser(userId: string): Promise<User | null> {
        const result = await this.db.get({
            TableName: this.table,
            Key: {
                partitionKey: userId,
                sortKey: 'USER'
            }
        }).promise()

        const document = result && result.Item
        const user = document ? new User(document) : null

        // Map the id back into the user so that it doesn't get lost
        if (user && document) {
            user.id = document.partitionKey
        }

        return user
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const result = await this.db.query({
            TableName: this.table,
            IndexName: 'GSI1',
            KeyConditionExpression: 'gsi1pk = :gsi1pk and gsi1sk = :gsi1sk',
            FilterExpression: 'emailConfirmed = :emailConfirmed',
            ExpressionAttributeValues: {
                ':gsi1pk': email,
                ':gsi1sk': 'USER',
                ':emailConfirmed': true,
            }
        }).promise()

        if (!result.Items?.length) {
            return null
        }

        const document = result && result.Items[0]
        const user = document ? new User(document) : null

        // Map the id back into the user so that it doesn't get lost
        if (user && document) {
            user.id = document.partitionKey
        }

        return user
    }

    async getUserByPhone(phoneNumber: string): Promise<User | null> {
        const result = await this.db.query({
            TableName: this.table,
            IndexName: 'GSI2',
            KeyConditionExpression: 'gsi2pk = :gsi2pk and gsi2sk = :gsi2sk',
            FilterExpression: 'phoneNumberConfirmed = :phoneNumberConfirmed',
            ExpressionAttributeValues: {
                ':gsi2pk': phoneNumber,
                ':gsi2sk': 'USER',
                ':phoneNumberConfirmed': true
            }
        }).promise()

        if (!result.Items?.length) {
            return null
        }

        const document = result && result.Items[0]
        const user = document ? new User(document) : null

        // Map the id back into the user so that it doesn't get lost
        if (user && document) {
            user.id = document.partitionKey
        }

        return user
    }


    async createUser(user: User): Promise<User> {
        const now = new Date().toISOString()
        user.createDate = now
        user.createBy = 'HARDCODED_FOR_NOW'
        user.updateDate = now
        user.updateBy = 'HARDCODED_FOR_NOW'

        const document = new UserDocument(user)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_not_exists(partitionKey) and attribute_not_exists(sortKey)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new UserAlreadyExistsError(document.partitionKey)
            }
            throw e
        }

        return user
    }

    async updateUser(user: User): Promise<User> {
        user.updateDate = new Date().toISOString()
        user.updateBy = 'HARDCODED_FOR_NOW'

        const document = new UserDocument(user)

        try {
            await this.db.put({
                TableName: this.table,
                Item: document,
                ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)'
            }).promise()
        } catch (e: any) {
            if (e.code === 'ConditionalCheckFailedException') {
                throw new UserNotFoundError(document.partitionKey)
            }
            throw e
        }

        return user
    }

    async searchUsers(name: string, limit: number): Promise<SearchResponse> {
        const filters = {}
        if (name) {
            // @ts-ignore
            filters['nameLower'] = {
                ComparisonOperator: 'CONTAINS',
                AttributeValueList: [name.split(' ').filter(n => n).join('_').toLowerCase()]
            }
        }

        const response = await this.db.scan({
            TableName: this.table,
            ScanFilter: filters,
            Select: 'ALL_ATTRIBUTES',
            Limit: limit
        }).promise()

        const users = (response.Items || []).map(i => new User(i))
        return new SearchResponse(users)
    }
}

export {UserDao}