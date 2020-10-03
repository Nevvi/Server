'use strict'

const DraftkingsDAO = require('../dao/draftkings/DraftkingsDAO')
const Constants = require('../model/Constants')

module.exports = class PaymentService {
    constructor() {
        this.draftKingsDAO = new DraftkingsDAO()
    }

    async getContests() {
        // 1 is the status for NFL
        const contests = await this.draftKingsDAO.getContests(Constants.DRAFTKINGS_NFL_CODE)
        return contests.sort(c => c.startTime)
    }

}