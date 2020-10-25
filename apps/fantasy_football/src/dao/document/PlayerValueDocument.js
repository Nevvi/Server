'use strict'

const {PlayerValue} = require('../../model/Player')

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about a single player
        this.partitionKey = body.id
        this.sortKey = `VALUE^${body.week}`

        // GSI1 on weekly value so we can get value of all players for a week
        this.gsi1pk = `VALUE^${body.week}`
        this.gsi1sk = body.id

        // data fields
        this.id = body.id
        this.week = body.week
        this.value = body.value
        this.explanations = body.explanations
        this.firstName = body.firstName
        this.lastName = body.lastName
        this.position = body.position
    }

    toModel() {
        return new PlayerValue(this.id, this.week, this.value, this.explanations, this.firstName, this.lastName, this.position)
    }
}