'use strict'

const {Player} = require("../../model/Player")

module.exports = class {
    constructor(body) {
        // dynamodb fields
        this.partitionKey = 'PLAYER'
        this.sortKey = body.id

        if (body.team) {
            this.gsi1pk = body.team
            this.gsi1sk = `PLAYER^${body.id}`
        }

        // data fields
        this.id = body.id
        this.firstName = body.firstName
        this.lastName = body.lastName
        this.position = body.position
        this.team = body.team
        this.imageUrl = body.imageUrl
    }

    toPlayer() {
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