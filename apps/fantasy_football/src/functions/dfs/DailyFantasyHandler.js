'use strict';

const {Lineup, Configuration} = require('../../model/Lineup')
const FantasyFootballService = require("../../service/FantasyFootballService")

const service = new FantasyFootballService()

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

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}