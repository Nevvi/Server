'use strict'

class Player {
    constructor(id, firstName, lastName, position, team, imageUrl) {
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.position = position
        this.team = team
        this.imageUrl = imageUrl
    }
}

class ValuedPlayer extends Player {
    constructor(player, value, cost) {
        super(player.id, player.firstName, player.lastName, player.position, player.team, player.imageUrl);
        this.value = value
        this.cost = cost
    }
}

module.exports = {
    Player,
    ValuedPlayer
}