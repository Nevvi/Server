'use strict'

const AWS = require('aws-sdk')
const axios = require('axios')

// DTOs
const GameDocument = require('./document/GameDocument')
const GameDTO = require('./dto/GameDTO')

module.exports = class {
    constructor() {
        this.table = process.env.PLAYER_TABLE
        this.db = new AWS.DynamoDB.DocumentClient({})
        this.authorization = process.env.MYSPORTSFEEDS_AUTHORIZATION_TOKEN
        this.baseUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nfl'
        this.currentSeason = process.env.MYSPORTSFEEDS_SEASON
    }

    async getGame(team, week) {
        console.log(`Getting game info for ${team} on week ${week}`)

        const gameInfo = await this.db.get({
            TableName: this.table,
            Key: {
                partitionKey: team.toUpperCase(),
                sortKey: `GAME^${week}`
            }
        }).promise()

        // TODO - map to model
        return gameInfo.Item
    }

    async refreshGames() {
        console.log("Refreshing all games")
        const latestGames = await this.getRemoteGames()
        console.log(`Refreshing ${latestGames.length} games`)
        await this.batchSaveGames(latestGames)
    }

    async getRemoteGames() {
        console.log("Getting all games from remote source")
        const path = `/${this.currentSeason}/games.json`
        const res = await axios.get(`${this.baseUrl}${path}`, {
            headers: {
                Authorization: this.authorization
            }
        })

        return res.data.games.map(g => new GameDTO(g))
    }

    async batchSaveGames(games) {
        console.log(`Saving ${games.length} games to the database`)

        // Batch write supports a max of 25 put requests at a time
        let i,j,chunk = 12;
        for (i=0,j=games.length; i<j; i+=chunk) {
            // For each game insert 1 record indexed with home team, and one indexed with away team so we can find all games for a team in 1 query
            const requests = []
            games.slice(i,i+chunk).forEach(game => {
                requests.push(
                    {PutRequest: {Item: new GameDocument({team: game.schedule.homeTeam, opponent: game.schedule.awayTeam, ...game})}},
                    {PutRequest: {Item: new GameDocument({team: game.schedule.awayTeam, opponent: game.schedule.homeTeam, ...game})}}
                )
            })
            await this.db.batchWrite({
                RequestItems: {
                    [this.table]: requests
                }
            }).promise()
        }
    }
}