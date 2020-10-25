'use strict'

const {Game} = require('../../model/Game')

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about a single player
        this.partitionKey = body.team
        this.sortKey = `GAME^${body.schedule.week}`

        this.gsi1pk = body.opponent
        this.gsi1sk = `GAME^${body.schedule.week}`

        // data fields
        this.id = body.schedule.id
        this.week = body.schedule.week
        this.homeTeam = body.schedule.homeTeam
        this.awayTeam = body.schedule.awayTeam
        this.attendance = body.schedule.attendance
        this.weather = body.schedule.weather
    }

    toModel() {
        return new Game(this.id, this.week, this.homeTeam, this.awayTeam, this.attendance, this.weather)
    }
}