'use strict'

import {Db, MongoServerError} from "mongodb";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// models
import {ConnectionRequest} from "../model/connection/ConnectionRequest";
import {RequestStatus} from "../model/connection/RequestStatus";
const UserDocument = require('./document/UserDocument.ts')
const ConnectionDocument = require('./document/ConnectionDocument.ts')
const ConnectionRequestDocument = require('./document/ConnectionRequestDocument.ts')
import {
    ConnectionExistsError,
    ConnectionRequestDoesNotExistError,
    ConnectionRequestExistsError,
} from "../error/Errors";
import {Connection} from "../model/connection/Connection";
import {SlimUser} from "../model/user/SlimUser";
import {SearchResponse} from "../model/response/SearchResponse";
import {int} from "aws-sdk/clients/datapipeline";

class ConnectionDao {
    private db: Db;
    private requestCollectionName: string;
    private connectionCollectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.requestCollectionName = 'connection_requests'
        this.connectionCollectionName = 'connections'
    }

    async getConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<ConnectionRequest | null> {
        const result = await this.db.collection(this.requestCollectionName)
            .findOne({requestingUserId: requestingUserId, requestedUserId: requestedUserId})

        return result ? new ConnectionRequest(result) : null
    }

    async getConnectionRequests(requestedUserId: string, status: RequestStatus): Promise<ConnectionRequest[]> {
        const results = await this.db.collection(this.requestCollectionName)
            .find({ requestedUserId: requestedUserId, status: status })
            .toArray()

        return (results || []).map(i => new ConnectionRequest(i))
    }

    async createConnectionRequest(requestingUserId: string, requestedUserId: string, requesterImage: string, requestText: string, permissionGroupName: string): Promise<ConnectionRequest> {
        const now = new Date().toISOString()
        const document = new ConnectionRequestDocument({
            requestingUserId,
            requestedUserId,
            requesterImage,
            requestText,
            requestingPermissionGroupName: permissionGroupName,
            status: RequestStatus.PENDING,
            createDate: now,
            createBy: 'HARDCODED_FOR_NOW',
            updateDate: now,
            updateBy: 'HARDCODED_FOR_NOW'
        })

        try {
            await this.db.collection(this.requestCollectionName).insertOne(document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
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
            await this.db.collection(this.requestCollectionName)
                .replaceOne({requestingUserId: request.requestingUserId, requestedUserId: request.requestedUserId}, document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                throw new ConnectionRequestDoesNotExistError()
            }
            throw e
        }

        return request
    }

    async deleteConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<boolean> {
        const result = await this.db.collection(this.requestCollectionName)
            .deleteOne({requestingUserId: requestingUserId, requestedUserId: requestedUserId})

        return result.deletedCount === 1
    }

    async createConnection(userId: string, connectedUserId: string, permissionGroupName: string): Promise<ConnectionRequest> {
        const now = new Date().toISOString()
        const document = new ConnectionDocument({
            userId,
            connectedUserId,
            permissionGroupName,
            inSync: false,
            createDate: now,
            createBy: 'HARDCODED_FOR_NOW',
            updateDate: now,
            updateBy: 'HARDCODED_FOR_NOW'
        })

        try {
            await this.db.collection(this.connectionCollectionName).insertOne(document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                throw new ConnectionExistsError()
            }
            throw e
        }

        return new ConnectionRequest(document)
    }

    async getConnections(userId: string, name: string | undefined, inSync: boolean | undefined, limit: number, skip: number): Promise<SearchResponse> {
        const pipeline: any = [
            {
                '$match': {
                    'userId': userId,
                    'inSync': inSync !== undefined ? inSync : { '$exists': true }
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'connectedUserId',
                    'foreignField': '_id',
                    'as': 'connectedUser'
                }
            }
        ]

        if (name) {
            const search = name.split(' ').filter(n => n).join('_').toLowerCase()
            pipeline.push({
                '$match': {
                    'connectedUser.nameLower':  {$regex : search}
                }
            })
        }

        pipeline.push({
            '$facet': {
                'connections': [
                    {
                        '$skip': skip
                    },
                    {
                        '$limit': limit
                    }
                ],
                'connectionCount': [
                    {
                        '$count': 'connectionCount'
                    }
                ]
            }
        })

        const result = await this.db.collection(this.connectionCollectionName)
            .aggregate(pipeline)
            .next()

        // Return the user that we mapped over so that we don't need to grab all that info again 1 by 1...
        // Also return the total count before pagination was applied
        const userResults: any[] = (result?.connections || [])
        const users = userResults
            .filter(i => i["connectedUser"] && i["connectedUser"].length === 1)
            .map(i => {
                const user = new SlimUser(new UserDocument(i["connectedUser"][0]))
                user.id = i["connectedUser"][0]._id
                user.inSync = i["inSync"]
                return user
            })

        // connectionCount comes back nested
        let userCount = 0
        if (result && result.connectionCount && result.connectionCount.length === 1) {
            userCount = result.connectionCount[0].connectionCount || 0
        }

        return new SearchResponse(users, userCount)
    }

    async getConnection(userId: string, connectedUserId: string): Promise<Connection | undefined> {
        const result = await this.db.collection(this.connectionCollectionName)
            .findOne({userId: userId, connectedUserId: connectedUserId})

        return result ? new Connection(result) : undefined
    }

    async updateConnection(userId: string, connectedUserId: string, permissionGroup: string | undefined, inSync: boolean | undefined): Promise<boolean> {
        if (permissionGroup === undefined && inSync === undefined) {
            return true
        }

        const fieldsToSet: any = {}
        if (permissionGroup) {
            fieldsToSet["permissionGroupName"] = permissionGroup
        }
        if (inSync !== undefined) {
            fieldsToSet["inSync"] = inSync
        }

        const result = await this.db.collection(this.connectionCollectionName)
            .updateOne(
                {userId: userId, connectedUserId: connectedUserId},
                {$set: fieldsToSet},
            )

        return result && result.modifiedCount === 1
    }

    async deleteConnection(userId: string, connectedUserId: string): Promise<boolean> {
        const result = await this.db.collection(this.connectionCollectionName)
            .deleteOne({userId: userId, connectedUserId: connectedUserId},)

        return result && result.deletedCount === 1
    }

    async markConnections(userId: string): Promise<int> {
        // Update the connections of all the people connected to this user as out of sync
        // so that they are notified to grab the latest data
        const result = await this.db.collection(this.connectionCollectionName)
            .updateMany(
                {connectedUserId: userId},
                {$set: {"inSync": false}},
            )

        return result && result.modifiedCount
    }

    async getOutOfSyncUsers(skip: int = 0, limit: int = 500): Promise<string[]> {
        const pipeline = [{
            $match: {
                inSync: false
            }
        }, {
            $group: {
                _id: '$userId',
                outOfSync: {
                    $sum: 1
                }
            }
        }, {
            $skip: skip
        }, {
            $limit: limit
        }]

        const results = await this.db.collection(this.connectionCollectionName)
            .aggregate(pipeline)
            .toArray()

        return results.map(doc => {
            return doc["_id"]
        })
    }
}

export {ConnectionDao}