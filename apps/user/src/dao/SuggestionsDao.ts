'use strict'

import {Db} from "mongodb";

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

import {SlimUser} from "../model/user/SlimUser";
const UserDocument = require('./document/UserDocument.ts')

class SuggestionsDao {
    private db: Db;
    private collectionName: string;

    constructor() {
        this.db = client.db('nevvi')
        this.collectionName = 'connection_suggestions'
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
                { _id: userId },
                { $pull: { suggestions: suggestedUserId }}
            )

        return result.modifiedCount === 1
    }
}

export {SuggestionsDao}