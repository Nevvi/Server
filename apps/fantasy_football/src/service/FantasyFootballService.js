'use strict'

const DraftkingsDAO = require('../dao/draftkings/DraftkingsDAO')
const LineupOptimizer = require('./LineupOptimizer')
const Constants = require('../model/Constants')
const Configuration = require('../model/Configuration')

module.exports = class PaymentService {
    constructor() {
        this.draftKingsDAO = new DraftkingsDAO()
        this.optimizer = new LineupOptimizer()
    }

    async getContest(contestId) {
        // 1 is the status for NFL
        // TODO - add call in DAO for single contest
        const contests = await this.draftKingsDAO.getContests(Constants.DRAFTKINGS_NFL_CODE)
        return contests.find(c => c.id === contestId)
    }

    async getContests() {
        // 1 is the status for NFL
        const contests = await this.draftKingsDAO.getContests(Constants.DRAFTKINGS_NFL_CODE)
        return contests.sort(c => c.startTime)
    }

    async optimize(contest) {
        const players = await this.draftKingsDAO.getPlayers(contest.draftGroup)
        console.log(`Evaluating ${players.length} players`)
        return this.optimizer.optimize(players, new Configuration())
    }

}