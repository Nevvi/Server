'use strict'

const AWS = require('aws-sdk')
const axios = require('axios')
const PlayerDocument = require('./document/PlayerDocument')
const {Player} = require('../model/Player')

module.exports = class {
    constructor() {
        this.table = process.env.PLAYER_TABLE
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.authorization = process.env.MYSPORTSFEEDS_AUTHORIZATION_TOKEN
        this.baseUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nfl'
    }

    async getAllPlayers() {
        console.log("Getting all players")

        // TODO - handle pagination for large response
        const players = await this.db.query({
            TableName: this.table,
            KeyConditionExpression: "partitionKey = :partitionKey",
            ExpressionAttributeValues: {
                ":partitionKey": "PLAYER"
            }
        }).promise()

        return players.Items.map(doc => new PlayerDocument(doc).toPlayer())
    }

    async refreshPlayers() {
        console.log("Refreshing all position players")
        const latestPlayers = await this.getRemotePlayers()
        console.log(`Refreshing ${latestPlayers.length} players`)
        await this.batchSavePlayers(latestPlayers)
    }

    async getRemotePlayers() {
        console.log("Getting all position players from remote source")
        const path = '/players.json?position=qb,wr,rb,te'
        const res = await axios.get(`${this.baseUrl}${path}`, {
            headers: {
                Authorization: this.authorization
            }
        })

        return res.data.players.map(p => new Player(
            p.player.id.toString(),
            p.player.firstName,
            p.player.lastName,
            p.player.primaryPosition,
            p.player.currentTeam && p.player.currentTeam.abbreviation,
            p.player.officialImageSrc
        ))
    }

    async batchSavePlayers(players) {
        console.log(`Saving ${players.length} players to the database`)

        // Batch write supports a max of 25 put requests at a time
        let i,j,chunk = 25;
        for (i=0,j=players.length; i<j; i+=chunk) {
            const requests = players.slice(i,i+chunk).map(player => { return { PutRequest: { Item: new PlayerDocument(player) } } })
            await this.db.batchWrite({
                RequestItems: {
                    [this.table]: requests
                }
            }).promise()
        }
    }
}