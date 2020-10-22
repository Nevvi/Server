'use strict'

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about a single player
        this.partitionKey = body.team
        this.sortKey = `GAME^${body.schedule.week}`

        this.gsi1pk = body.opponent
        this.gsi1sk = `GAME^${body.schedule.week}`

        // TODO - leverage this
        // this.gsi2pk =
        // this.gsi2sk =

        // data fields
        this.id = body.schedule.id
        this.week = body.schedule.week
        this.homeTeam = body.schedule.homeTeam
        this.awayTeam = body.schedule.awayTeam
        this.attendance = body.schedule.attendance
        this.weather = body.schedule.weather
    }
}