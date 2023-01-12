'use strict'

import {Db, MongoServerError} from "mongodb";
const { v4: uuidv4 } = require('uuid');

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// models
const ConnectionGroupDocument = require('./document/ConnectionGroupDocument.ts')
import {
    ConnectionGroupExistsError,
} from "../error/Errors";
import {ConnectionGroup} from "../model/connection/ConnectionGroup";

class ConnectionGroupDao {
    private db: Db;
    private collectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.collectionName = 'connection_groups'
    }

    async createConnectionGroup(userId: string, name: string): Promise<ConnectionGroup> {
        const now = new Date().toISOString()
        const document = new ConnectionGroupDocument({
            id: uuidv4(),
            userId,
            name,
            connections: [],
            createDate: now,
            createBy: 'HARDCODED_FOR_NOW',
            updateDate: now,
            updateBy: 'HARDCODED_FOR_NOW'
        })

        try {
            await this.db.collection(this.collectionName).insertOne(document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                throw new ConnectionGroupExistsError(name)
            }
            throw e
        }

        const group = new ConnectionGroup(document)
        group.id = document._id
        return group
    }

    async getConnectionGroup(userId: string, groupId: string): Promise<ConnectionGroup | null> {
        const result = await this.db.collection(this.collectionName)
            .findOne({ userId: userId, _id: groupId })

        if (!result) {
            return null
        }

        const group = new ConnectionGroup(result)
        // @ts-ignore
        group.id = i._id
        return group
    }

    async getConnectionGroups(userId: string): Promise<ConnectionGroup[]> {
        const results = await this.db.collection(this.collectionName)
            .find({ userId: userId })
            .toArray()

        return (results || []).map(i => {
            const group = new ConnectionGroup(i)
            // @ts-ignore
            group.id = i._id
            return group
        })
    }

    async deleteConnectionGroup(userId: string, groupId: string): Promise<boolean> {
        const result = await this.db.collection(this.collectionName)
            .deleteOne({ userId: userId, _id: groupId })

        return result.deletedCount === 1
    }

    async addUserToGroup(userId: string, groupId: string, connectedUserId: string): Promise<boolean> {
        const result = await this.db.collection(this.collectionName)
            .updateOne(
                { userId: userId, _id: groupId },
                { $push: { connections: connectedUserId }}
            )

        return result.modifiedCount === 1
    }

    async removeUserFromGroup(userId: string, groupId: string, connectedUserId: string): Promise<boolean> {
        const result = await this.db.collection(this.collectionName)
            .updateOne(
                { userId: userId, _id: groupId },
                { $pull: { connections: connectedUserId }}
            )

        return result.modifiedCount === 1
    }
}

export {ConnectionGroupDao}