'use strict'

const axios = require('axios')
const Contest = require('../../model/DraftKingsContest')
const Player = require('../../model/DraftKingsPlayer')

module.exports = class {

    constructor() {
        this.baseUrl = 'https://draftkings.com'
    }

    async getContests(sport) {
        console.log(`Getting contests for sport code ${sport}`)
        const path = '/lobby/getcontests'
        const res = await axios.get(`${this.baseUrl}${path}`)
        return res.data.Contests.filter(c => c.s === sport).map(c => new Contest(c))
    }

    async getPlayers(draftGroup) {
        console.log(`Getting players in draft group ${draftGroup}`)
        const path = '/lineup/getavailableplayers'
        const res = await axios.get(`${this.baseUrl}${path}?draftGroupId=${draftGroup}`)
        return res.data.playerList.map(p => new Player(p))
    }
}