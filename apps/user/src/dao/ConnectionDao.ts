'use strict'

import {Db, MongoServerError} from "mongodb";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// models
import {ConnectionRequest} from "../model/connection/ConnectionRequest";
import {RequestStatus} from "../model/connection/RequestStatus";
const ConnectionDocument = require('./document/ConnectionDocument.ts')
const ConnectionRequestDocument = require('./document/ConnectionRequestDocument.ts')
import {
    ConnectionExistsError,
    ConnectionRequestDoesNotExistError,
    ConnectionRequestExistsError,
} from "../error/Errors";
import {Connection} from "../model/connection/Connection";

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

    async deleteConnectionRequest(requestingUserId: string, requestedUserId: string): Promise<boolean | null> {
        const result = await this.db.collection(this.requestCollectionName)
            .deleteOne({requestingUserId: requestingUserId, requestedUserId: requestedUserId})

        return result.deletedCount == 1
    }

    async createConnection(userId: string, connectedUserId: string, permissionGroupName: string): Promise<ConnectionRequest> {
        const now = new Date().toISOString()
        const document = new ConnectionDocument({
            userId,
            connectedUserId,
            permissionGroupName,
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

    async getConnections(userId: string): Promise<Connection[]> {
        const results = await this.db.collection(this.connectionCollectionName)
            .find({ userId: userId })
            .toArray()

        return (results || []).map(i => new Connection(i))
    }

    async getConnection(userId: string, connectedUserId: string): Promise<Connection | undefined> {
        const result = await this.db.collection(this.connectionCollectionName)
            .findOne({userId: userId, connectedUserId: connectedUserId})

        return result ? new Connection(result) : undefined
    }
}

export {ConnectionDao}