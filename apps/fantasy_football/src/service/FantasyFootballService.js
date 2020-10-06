'use strict'

const DraftkingsDAO = require('../dao/draftkings/DraftkingsDAO')
const LineupOptimizer = require('./LineupOptimizer')
const Constants = require('../model/Constants')

module.exports = class PaymentService {
    constructor() {
        this.draftKingsDAO = new DraftkingsDAO()
        this.optimizer = new LineupOptimizer()
    }

    async getContest(contestId) {
        // 1 is the status for NFL
        // TODO - add call in DAO for single contest
        const contests = await this.draftKingsDAO.getContests(Constants.DK_SPORT_CODES.NFL)
        return contests.find(c => c.id === contestId)
    }

    async getContests() {
        // 1 is the status for NFL
        const contests = await this.draftKingsDAO.getContests(Constants.DK_SPORT_CODES.NFL)
        return contests.sort(c => c.startTime)
    }

    async optimize(contest) {
        const players = await this.draftKingsDAO.getPlayers(contest.draftGroup)
        const filtered = players.filter(p => p.status !== "IR")
        // TODO - filter out players if desired
        console.log(`Evaluating ${filtered.length} out of ${players.length} total players`)
        return this.optimizer.optimize(filtered)
    }

}