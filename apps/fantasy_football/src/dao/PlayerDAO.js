'use strict'

const AWS = require('aws-sdk')
const axios = require('axios')

// DTOs
const PlayerDocument = require('./document/PlayerDocument')
const GamelogDocument = require('./document/GamelogDocument')
const PlayerValueDocument = require('./document/PlayerValueDocument')
const PlayerGamelogDTO = require('./dto/PlayerGamelogDTO')

// Models
const {Player, PlayerValue} = require('../model/Player')

const { v4: uuidv4 } = require('uuid')

module.exports = class {
    constructor() {
        this.table = process.env.PLAYER_TABLE
        this.queue = process.env.PLAYER_ACTION_QUEUE
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.sqs = new AWS.SQS({})
        this.authorization = process.env.MYSPORTSFEEDS_AUTHORIZATION_TOKEN
        this.baseUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nfl'
        this.currentSeason = process.env.MYSPORTSFEEDS_SEASON
    }

    async getAllPlayers() {
        console.log("Getting all players")

        // TODO - handle pagination for large response
        const players = await this.db.query({
            TableName: this.table,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :gsi1pk",
            ExpressionAttributeValues: {
                ":gsi1pk": "PLAYER"
            }
        }).promise()

        return players.Items.map(doc => new PlayerDocument(doc).toModel())
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

    async loadPlayerStats(week) {
        console.log(`Loading all position player stats from remote source for week ${week}`)
        const gamelogDTOs = await this.getRemotePlayerStats(week)

        // TODO - store data by year?
        // Map the DTO from the remote source to a document in our system
        const documents = gamelogDTOs.map(dto => {
            dto.id = dto.player.id.toString()
            dto.week = dto.game.week
            dto.firstName = dto.player.firstName
            dto.lastName = dto.player.lastName
            dto.position = dto.player.position
            dto.team = dto.team.name
            dto.opponent = dto.game.homeTeam === dto.team ? dto.game.awayTeam : dto.game.homeTeam
            return new GamelogDocument(dto)
        })

        await this.batchSavePlayerStats(documents)
    }

    async getRemotePlayerStats(week) {
        console.log(`Getting all position player stats from remote source for week ${week}`)
        const path = `/${this.currentSeason}/week/${week}/player_gamelogs.json?position=qb,wr,rb,te`
        const res = await axios.get(`${this.baseUrl}${path}`, {
            headers: {
                Authorization: this.authorization
            }
        })

       return res.data.gamelogs.map(g => new PlayerGamelogDTO(g))
    }

    // TODO - ideally this takes in a model and not a document but this should only be called inside the DAO
    async batchSavePlayerStats(documents) {
        console.log(`Saving ${documents.length} stats to the database`)

        // Batch write supports a max of 25 put requests at a time
        let i,j,chunk = 25;
        for (i=0,j=documents.length; i<j; i+=chunk) {
            const requests = documents.slice(i,i+chunk).map(stats => { return { PutRequest: { Item: stats } } })
            await this.db.batchWrite({
                RequestItems: {
                    [this.table]: requests
                }
            }).promise()
        }
    }

    async getPlayer(playerId) {
        console.log(`Getting player info for ${playerId}`)

        const playerInformation = await this.db.query({
            TableName: this.table,
            KeyConditionExpression: "partitionKey = :partitionKey",
            ExpressionAttributeValues: {
                ":partitionKey": playerId
            }
        }).promise()

        const baseInformation = playerInformation.Items.find(i => i.sortKey === 'PLAYER')

        if (!baseInformation) return null

        // Multiple document types live under same partition key
        // Extract each type and construct the player model accordingly
        // TODO - convert gamelog document to gamelog model
        const player = new PlayerDocument(baseInformation).toModel()

        const statsMap = {}
        playerInformation.Items.filter(i => i.sortKey.startsWith('STATS')).forEach(i => statsMap[i.week.toString()] = new GamelogDocument(i))
        player.weeklyStats = statsMap

        const valueMap = {}
        playerInformation.Items.filter(i => i.sortKey.startsWith('VALUE')).forEach(i => valueMap[i.week.toString()] = new PlayerValueDocument(i))
        player.weeklyValues = valueMap

        return player
    }

    async getWeeklyValues(week) {
        console.log(`Getting all player values for week ${week}`)

        // TODO - handle pagination for large response
        const values = await this.db.query({
            TableName: this.table,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :gsi1pk",
            ExpressionAttributeValues: {
                ":gsi1pk": `VALUE^${week}`
            }
        }).promise()

        return values.Items.map(doc => new PlayerValueDocument(doc).toModel())
    }

    async savePlayerValue(player, week) {
        console.log(`Saving player value for ${player.firstName} ${player.lastName} on week ${week}`)
        const value = player.getValue(week)
        await this.db.put({
            TableName: this.table,
            Item: new PlayerValueDocument({
                id: player.id,
                week: week,
                firstName: player.firstName,
                lastName: player.lastName,
                position: player.position,
                explanations: value.explanations,
                value: value.value
            })
        }).promise()
    }

    async evaluatePlayers(week) {
        const allPlayers = await this.getAllPlayers()

        // Batch write supports a max of 10 requests at a time
        let i,j,chunk = 10;
        for (i=0,j=allPlayers.length; i<j; i+=chunk) {
            // Map the player into an SQS request
            const requests = allPlayers.slice(i,i+chunk).map(player => {
                return {
                    Id: uuidv4(),
                    MessageBody: JSON.stringify({playerId: player.id, week: week})
                }
            })

            // Send the 10 messages
            await this.sqs.sendMessageBatch({
                Entries: requests,
                QueueUrl: this.queue
            }).promise()
        }

        return allPlayers
    }
}