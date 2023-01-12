'use strict'

import {Db, MongoServerError} from "mongodb";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// documents
const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';
import {SlimUser} from "../model/user/SlimUser";

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

    async searchUsers(userId: string, name: string, skip: number, limit: number): Promise<SlimUser[]> {
        const user = await this.getUser(userId)
        if (!user) {
            return []
        }

        const search = name.split(' ').filter(n => n).join('_').toLowerCase()

        const pipeline = [
            {
                '$match': {
                    'nameLower': {
                        '$regex': search
                    },
                    '_id': {
                        '$nin': [userId, ...user.blockedUsers]
                    },
                    'blockedUsers': {
                        '$nin': [userId]
                    }
                }
            },
            {
                '$skip': skip
            },
            {
                '$limit': limit
            },
            {
                '$lookup': {
                    'from': 'connections',
                    'let': {
                        'searchedUserId': '$_id'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$connectedUserId', '$$searchedUserId'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$userId', userId
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'connectedUser'
                }
            }
        ]

        const results = await this.db.collection(this.collectionName)
            .aggregate(pipeline)
            .toArray()

        return results.map(i => {
            const user = new SlimUser(new User(i))
            user.id = i._id
            user.connected = i["connectedUser"] && i["connectedUser"].length === 1
            return user
        })
    }

    async searchUserCount(userId: string, name: string): Promise<number> {
        const user = await this.getUser(userId)
        if (!user) {
            return 0
        }

        const search = name.split(' ').filter(n => n).join('_').toLowerCase()

        return await this.db.collection(this.collectionName)
            .countDocuments({
                nameLower: { $regex : search},
                _id: { $nin: [userId, ...user.blockedUsers] }, // don't show user themselves or users they blocked
                blockedUsers: { $nin: [userId] } // don't show user people that blocked them
            });
    }

    async getBlockedUsers(userId: string): Promise<SlimUser[]> {
        const pipeline: any = [
            {
                '$match': {
                    '_id': userId
                }
            },
            {
                '$unwind': {
                    'path': '$blockedUsers',
                    'preserveNullAndEmptyArrays': false
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'blockedUsers',
                    'foreignField': '_id',
                    'as': 'blockedUser'
                }
            }
        ]

        const results = await this.db.collection(this.collectionName)
            .aggregate(pipeline)
            .toArray()

        // Return the user that we mapped over so that we don't need to grab all that info again 1 by 1...
        return results
            .filter(i => i["blockedUser"] && i["blockedUser"].length === 1)
            .map(i => {
                const user = new SlimUser(new UserDocument(i["blockedUser"][0]))
                user.id = i["blockedUser"][0]._id
                return user
            })
    }
}

export {UserDao}