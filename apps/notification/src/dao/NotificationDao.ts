'use strict'

import {Db, MongoServerError} from "mongodb";
import {DeviceAlreadyExistsError} from "../error/Errors";
import {Device} from "../model/Device";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

const DeviceDocument = require('./document/DeviceDocument.ts')

class NotificationDao {
    private db: Db;
    private deviceCollectionName: string;
    private notificationCollectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.deviceCollectionName = 'devices'
        this.notificationCollectionName = 'notifications'
    }

    async getDevice(userId: string): Promise<Device | null> {
        const result = await this.db.collection(this.deviceCollectionName).findOne({ _id: userId })

        if (!result) {
            return null
        }

        const device = new Device(result)
        // @ts-ignore
        device.id = i._id
        return device
    }

    async addDevice(userId: string, token: string): Promise<Boolean> {
        const now = new Date().toISOString()
        const document = new DeviceDocument({
            userId,
            token,
            createDate: now,
            createBy: 'HARDCODED_FOR_NOW',
            updateDate: now,
            updateBy: 'HARDCODED_FOR_NOW'
        })

        try {
            await this.db.collection(this.deviceCollectionName).insertOne(document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                throw new DeviceAlreadyExistsError(userId)
            }
            throw e
        }

        return true
    }

    async updateDeviceToken(userId: string, token: string): Promise<Boolean> {
        const result = await this.db.collection(this.deviceCollectionName).updateOne(
            { _id: userId },
            { $set: { token: token }}
        )

        return result.modifiedCount === 1
    }
}

export {NotificationDao}