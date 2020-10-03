'use strict';

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

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}