'use strict';

const {Lineup, Configuration} = require('../../model/Lineup')
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
        const lineup = await service.optimize(contest)
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

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}