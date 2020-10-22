'use strict'

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about a single player
        this.partitionKey = body.id
        this.sortKey = `VALUE^${body.week}`

        // data fields
        this.id = body.id
        this.week = body.week
        this.value = body.value
        this.explanations = body.explanations
    }
}