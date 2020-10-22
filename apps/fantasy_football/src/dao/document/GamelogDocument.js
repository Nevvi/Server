'use strict'

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about a single player
        this.partitionKey = body.id
        this.sortKey = `STATS^${body.week}`

        // gsi1 on away team + position/week to see how a given team has fared against a team along with trends
        this.gsi1pk = body.opponent
        this.gsi1sk = `${body.position}^${body.week}`

        // TODO - leverage this
        // this.gsi2pk =
        // this.gsi2sk =

        // data fields
        this.id = body.id
        this.firstName = body.firstName
        this.lastName = body.lastName
        this.position = body.position
        this.team = body.team
        this.week = body.week
        this.opponent = body.opponent
        this.passingStats = body.passingStats
        this.rushingStats = body.rushingStats
        this.receivingStats = body.receivingStats
        this.value = body.value
    }
}