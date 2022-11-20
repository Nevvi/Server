'use strict'

// documents
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';
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
        console.log("Getting user for email", email)
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
        console.log("Getting user for phone", phoneNumber)
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

    async searchUsers(name: string, lastEvaluatedKey: string | undefined, limit: number): Promise<SearchResponse> {
        const filters = {}
        if (name) {
            // @ts-ignore
            filters['nameLower'] = {
                ComparisonOperator: 'CONTAINS',
                AttributeValueList: [name.split(' ').filter(n => n).join('_').toLowerCase()]
            }
        }

        let matched: any[] = []
        let lastKey = lastEvaluatedKey ?
            JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString('utf8')) :
            undefined

        do {
            const response: DocumentClient.ScanOutput = await this.db.scan({
                TableName: this.table,
                ScanFilter: filters,
                Select: 'ALL_ATTRIBUTES',
                ExclusiveStartKey: lastKey
            }).promise()

            lastKey = undefined
            if (response.Items && response.Items.length > 0) {
                const subset: DocumentClient.AttributeMap[] = response.Items.slice(0, limit - matched.length)
                matched = matched.concat(subset)

                // Had to trim the response to match the limit so let's set the last evaluated key to be
                // the key we trimmed to unless we are at the very end
                if (subset.length !== response.Items.length && response.LastEvaluatedKey) {
                    lastKey = subset.slice(-1)[0]
                    lastKey = { sortKey: subset.slice(-1)[0].sortKey, partitionKey: subset.slice(-1)[0].partitionKey }
                }
            }

            // If we didn't already set the last key, set it to the end of the last search
            lastKey = lastKey ? lastKey : response.LastEvaluatedKey
        } while(matched.length < limit && lastKey)

        const users = matched.map(i => {
            const user = new User(i)
            user.id = i.partitionKey
            return user
        })
        const lastKeySerialized = lastKey ? Buffer.from(JSON.stringify(lastKey)).toString('base64') : undefined
        return new SearchResponse(users, lastKeySerialized)
    }
}

export {UserDao}