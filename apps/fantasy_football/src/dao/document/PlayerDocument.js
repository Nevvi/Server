'use strict'

const {Player} = require("../../model/Player")

module.exports = class {
    constructor(body) {
        // primary index by player id to group all information about an individual player
        this.partitionKey = body.id
        this.sortKey = 'PLAYER'

        // gsi1 with hardcoded string so we can query for all players or players + position in the entire league
        this.gsi1pk = 'PLAYER'
        this.gsi1sk = body.position

        // if player is currently on a team then gsi2 on team so we can find all players or players + position on a given team
        if (body.team) {
            this.gsi2pk = body.team
            this.gsi2sk = body.position
        }

        // data fields
        this.id = body.id
        this.firstName = body.firstName
        this.lastName = body.lastName
        this.position = body.position
        this.team = body.team
        this.imageUrl = body.imageUrl
    }

    toModel() {
        return new Player(
            this.id,
            this.firstName,
            this.lastName,
            this.position,
            this.team,
            this.imageUrl
        )
    }
}