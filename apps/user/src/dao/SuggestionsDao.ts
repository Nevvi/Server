'use strict'

import {Db} from "mongodb";

const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

import {SlimUser} from "../model/user/SlimUser";
import {User} from "../model/user/User";

const UserDocument = require('./document/UserDocument.ts')

const MIN_SHARED_CONNECTIONS = 2

class SuggestionsDao {
    private db: Db;
    private collectionName: string;
    private userCollectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.collectionName = 'connection_suggestions'
        this.userCollectionName = 'users'
    }

    async findPossibleSuggestions(userId: string): Promise<User[]> {
        const pipeline: any = [
            {
                $match: {
                    _id: userId,
                },
            },
            {
                $lookup: {
                    from: "connections",
                    localField: "_id",
                    foreignField: "userId",
                    as: "connections",
                },
            },
            {
                $lookup: {
                    from: "connection_suggestions",
                    localField: "_id",
                    foreignField: "_id",
                    as: "suggestions",
                }
            },
            {
                $project: {
                    _id: 1,
                    connectionIds: "$connections.connectedUserId",
                    blockedUsers: 1,
                    ignoredSuggestions: {
                        "$ifNull": [{"$arrayElemAt": [ "$suggestions.ignored", 0 ]}, []]
                    }
                },
            },
            {
                $graphLookup: {
                    from: "connections",
                    startWith: "$_id",
                    connectFromField: "connectedUserId",
                    connectToField: "userId",
                    as: "connectionHierarchy",
                    maxDepth: 1,
                },
            },
            {
                $unwind: {
                    path: "$connectionHierarchy",
                },
            },
            {
                $project: {
                    connectionUserId: "$connectionHierarchy.userId",
                    suggestedUserId: "$connectionHierarchy.connectedUserId",
                    connectionIds: 1,
                    blockedUsers: 1,
                    ignoredSuggestions: 1
                },
            },
            {
                $addFields: {
                    connected: {
                        $in: [
                            "$suggestedUserId",
                            "$connectionIds",
                        ],
                    },
                    blocked: {
                        $in: [
                            "$suggestedUserId",
                            "$blockedUsers",
                        ],
                    },
                    ignored: {
                        $in: [
                            "$suggestedUserId",
                            "$ignoredSuggestions",
                        ],
                    }
                },
            },
            {
                $match: {
                    $and: [
                        {
                            connectionUserId: {
                                $ne: userId,
                            },
                        },
                        {
                            suggestedUserId: {
                                $ne: userId,
                            },
                        },
                        {
                            connected: false,
                        },
                        {
                            blocked: false,
                        },
                        {
                            ignored: false
                        }
                    ],
                },
            },
            {
                $group: {
                    _id: "$suggestedUserId",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $match: {
                    "count": {
                        $gte: MIN_SHARED_CONNECTIONS
                    }
                }
            },
            {
                $sort: {
                    count: -1,
                },
            },
            {
                $limit: 20,
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "suggestedUser",
                },
            },
        ]

        const suggestions = await this.db.collection(this.userCollectionName)
            .aggregate(pipeline)
            .toArray()

        return suggestions.filter(suggestion => {
            return suggestion["suggestedUser"] && suggestion["suggestedUser"].length === 1
        }).map(suggestion => {
            const user = new User(suggestion["suggestedUser"][0])
            user.id = suggestion._id
            return user
        })
    }

    async updateSuggestions(userId: string, suggestions: string[]) {
        await this.db.collection(this.collectionName).updateOne(
            {_id: userId},
            {$set: {"suggestions": suggestions}},
            {upsert: true}
        )
    }

    async getSuggestions(userId: string): Promise<SlimUser[]> {
        const pipeline: any = [
            {
                '$match': {
                    '_id': userId
                }
            }, {
                '$lookup': {
                    'from': 'connections',
                    'localField': '_id',
                    'foreignField': 'userId',
                    'as': 'connections'
                }
            }, {
                '$project': {
                    'suggestions': {
                        '$filter': {
                            'input': '$suggestions',
                            'as': 'suggestion',
                            'cond': {
                                '$not': {
                                    '$in': [
                                        '$$suggestion', '$connections.connectedUserId'
                                    ]
                                }
                            }
                        }
                    }
                }
            }, {
                '$unwind': {
                    'path': '$suggestions',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'suggestions',
                    'foreignField': '_id',
                    'as': 'suggestedUser'
                }
            }
        ]

        const results = await this.db.collection(this.collectionName)
            .aggregate(pipeline)
            .toArray()

        // Return the user that we mapped over so that we don't need to grab all that info again 1 by 1...
        return results
            .filter(i => i["suggestedUser"] && i["suggestedUser"].length === 1)
            .map(i => {
                const user = new SlimUser(new UserDocument(i["suggestedUser"][0]))
                user.id = i["suggestedUser"][0]._id
                return user
            })
    }

    async removeSuggestion(userId: string, suggestedUserId: string): Promise<boolean> {
        const result = await this.db.collection(this.collectionName)
            .updateOne(
                {_id: userId},
                {$pull: {suggestions: suggestedUserId}}
            )

        return result.modifiedCount === 1
    }

    async ignoreSuggestion(userId: string, suggestedUserId: string): Promise<boolean> {
        const update = {
            $pull: {suggestions: suggestedUserId},
            $push: {ignored: suggestedUserId}
        }

        const result = await this.db.collection(this.collectionName)
            .updateOne({_id: userId}, update)

        return result.modifiedCount === 1
    }
}

export {SuggestionsDao}