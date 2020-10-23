'use strict';

const FantasyFootballService = require("../../service/FantasyFootballService")

const service = new FantasyFootballService()

module.exports.refreshPlayers = async (event) => {
    try{
        console.log("Received request to refresh players")
        await service.refreshPlayers()
        return createResponse(200, {message: "Success!"})
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.refreshGames = async (event) => {
    try{
        console.log("Received request to refresh games")
        await service.refreshGames()
        return createResponse(200, {message: "Success!"})
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.loadPlayerStats = async (event) => {
    try{
        console.log("Received request to load player stats")
        const {week} = event.pathParameters
        await service.loadPlayerStats(parseInt(week))
        return createResponse(200, {message: "Success!"})
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.getContests = async (event) => {
    try{
        console.log("Received request to get contests")
        const contests = await service.getContests()
        return createResponse(200, contests)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.optimize = async (event) => {
    try{
        console.log("Received request to optimize")
        const {contestId} = event.pathParameters

        const contest = await service.getContest(parseInt(contestId))

        if (!contest) {
            return createResponse(404, {message: `No matching contest found for id ${contestId}`})
        }

        // TODO - extract preset players from body
        // TODO - dont hardcode week. Get it from contest, path param, or something else
        const lineup = await service.optimize(contest, "7")
        return createResponse(200, lineup)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.getPlayer = async (event) => {
    try{
        console.log("Received request to get player")
        const {playerId} = event.pathParameters
        const player = await service.getPlayer(playerId)

        if (!player) {
            return createResponse(404, {message: `No matching player found for id ${playerId}`})
        }

        return createResponse(200, player)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

// {"playerId": "7478", "week": "1"}
module.exports.evaluatePlayer = async (event) => {
    try {
        console.log(`Processing ${event.Records.length} message(s)`)
        await Promise.all(event.Records.map(async record => {
            console.log(`Processing message ${record.messageId} - ${record.body}`)
            const body = JSON.parse(record.body)

            const player = await service.getPlayer(body.playerId.toString())

            if (!player) {
                console.log(`No player found with id ${body.playerId.toString()}`)
                return
            }

            return service.evaluatePlayer(player, body.week.toString())
        }))
        console.log(`Done processing ${event.Records.length} message(s)`)
    } catch (e) {
        console.log(e)
    }
}

module.exports.evaluatePlayers = async (event) => {
    try{
        console.log("Received request to evaluate players")
        const {week} = event.pathParameters
        const players = await service.evaluatePlayers(week)
        return createResponse(200, {message: `Submitted requests to evaluate ${players.length} players`})
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}