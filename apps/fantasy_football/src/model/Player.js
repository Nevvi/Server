'use strict'

class Player {
    constructor(id, firstName, lastName, position, team, imageUrl, weeklyStats) {
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.position = position
        this.team = team
        this.imageUrl = imageUrl
        this.weeklyStats = weeklyStats || {}
    }

    getStats(week) {
        return this.weeklyStats[week]
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