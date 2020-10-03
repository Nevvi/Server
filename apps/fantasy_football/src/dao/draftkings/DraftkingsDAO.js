'use strict'

const axios = require('axios')
const Contest = require('../../model/Contest')

module.exports = class {

    constructor() {
        this.baseUrl = 'https://draftkings.com'
    }

    async getContests(sport) {
        const path = '/lobby/getcontests'
        const res = await axios.get(`${this.baseUrl}${path}`)
        return res.data.Contests.filter(c => c.s === sport).map(c => new Contest(c))
    }
}