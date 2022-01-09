'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';

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
        return document ? new User(document) : null
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
}

export {UserDao}