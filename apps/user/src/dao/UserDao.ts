'use strict'

import {Db, MongoServerError} from "mongodb";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// documents
const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';
import {SearchResponse} from "../model/response/SearchResponse";

const {UserAlreadyExistsError, UserNotFoundError} = require('../error/Errors.ts')

class UserDao {
    private db: Db;
    private readonly collectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.collectionName = 'users'
    }

    async getUser(userId: string): Promise<User | null> {
        const result = await this.db.collection(this.collectionName).findOne({_id: userId})
        if (!result) {
            return null
        }

        // TODO - clean this up
        const user = new User(result)
        user.id = result._id
        return user
    }

    async getUserByEmail(email: string): Promise<User | null> {
        console.log("Getting user for email", email)
        const result = await this.db.collection(this.collectionName).findOne({email: email})
        if (!result) {
            return null
        }

        // TODO - clean this up
        const user = new User(result)
        user.id = result._id
        return user
    }

    async getUserByPhone(phoneNumber: string): Promise<User | null> {
        const result = await this.db.collection(this.collectionName).findOne({phoneNumber: phoneNumber})
        if (!result) {
            return null
        }

        // TODO - clean this up
        const user = new User(result)
        user.id = result._id
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
            await this.db.collection(this.collectionName).insertOne(document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                console.log(`Error worth logging: ${e}`); // special case for some reason
                throw new UserAlreadyExistsError(document._id)
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
            await this.db.collection(this.collectionName).replaceOne({_id: document._id}, document)
        } catch (e: any) {
            if (e instanceof MongoServerError) {
                console.log(`Error worth logging: ${e}`); // special case for some reason
                throw new UserNotFoundError(document._id)
            }
            throw e
        }

        return user
    }

    async searchUsers(name: string, skip: number, limit: number): Promise<User[]> {
        const search = name.split(' ').filter(n => n).join('_').toLowerCase()

        const results = await this.db.collection("users")
            .find({ nameLower: {$regex : search} })
            .skip(skip)
            .limit(limit)
            .toArray()

        return results.map(i => {
            const user = new User(i)
            user.id = i._id
            return user
        })
    }

    async searchUserCount(name: string): Promise<number> {
        const search = name.split(' ').filter(n => n).join('_').toLowerCase()

        return await this.db.collection("users")
            .countDocuments({ nameLower: {$regex : search} });
    }
}

export {UserDao}