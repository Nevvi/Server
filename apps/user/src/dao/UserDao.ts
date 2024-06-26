'use strict'

import {Db, MongoServerError} from "mongodb";

const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

// documents
const UserDocument = require('./document/UserDocument.ts')

// models
import {User} from '../model/user/User';
import {SlimUser} from "../model/user/SlimUser";
import {int} from "aws-sdk/clients/datapipeline";

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

    async getUsers(skip: number = 0, limit: number = 1000): Promise<SlimUser[]> {
        console.log("Getting users for skip: " + skip + " and limit: " + limit)
        const pipeline = [
            {
                '$skip': skip
            },
            {
                '$limit': limit
            },
        ]

        const results = await this.db.collection(this.collectionName)
            .aggregate(pipeline)
            .toArray()

        return results.map(i => {
            const user = new SlimUser(new User(i))
            user.id = i._id
            return user
        })
    }

    async searchUsers(userId: string, name: string, phoneNumbers: string[], skip: number, limit: number): Promise<SlimUser[]> {
        console.log("Searching for users by name " + name + " and phone numbers " + phoneNumbers)
        const user = await this.getUser(userId)
        if (!user) {
            return []
        }

        // TODO - if phoneNumbers is long we may want to chunk this out
        const query = this.getQuery(user, name, phoneNumbers)
        const pipeline = [
            {
                '$match': query
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
            },
            {
                '$lookup': {
                    'from': 'connection_requests',
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
                                                '$requestedUserId', '$$searchedUserId'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$requestingUserId', userId
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'requestedUser'
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
            user.requested = i["requestedUser"] && i["requestedUser"].length === 1
            return user
        })
    }

    async searchUserCount(userId: string, name: string, phoneNumbers: string[]): Promise<number> {
        const user = await this.getUser(userId)
        if (!user) {
            return 0
        }

        const query = this.getQuery(user, name, phoneNumbers)
        return await this.db.collection(this.collectionName).countDocuments(query);
    }

    private getQuery(user: User, name: string, phoneNumbers: string[]): any {
        const query: any = {
            '_id': {'$nin': [user.id, ...user.blockedUsers]}, // don't show user themselves or users they blocked
            'blockedUsers': {'$nin': [user.id]} // don't show user people that blocked them
        }

        if (phoneNumbers !== undefined && phoneNumbers.length > 0) {
            query['phoneNumber'] = {$in: phoneNumbers}
        } else if (name !== undefined) {
            const search = name.split(' ').filter(n => n).join('_').toLowerCase()
            query['nameLower'] = {$regex: search}
        }

        return query
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

    async getUsersByBirthday(birthday: Date): Promise<User[]> {
        const pipeline: any = [
            {
                '$match': {
                    'birthdayMonth': birthday.getMonth(),
                    'birthdayDayOfMonth': birthday.getDate(),
                }
            }
        ]

        const results = await this.db.collection(this.collectionName)
            .aggregate(pipeline)
            .toArray()

        return results.map(res => {
            const user = new User(res)
            user.id = res._id
            return user
        })
    }
}

export {UserDao}