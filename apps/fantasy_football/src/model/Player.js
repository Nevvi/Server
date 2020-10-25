'use strict'

class Player {
    constructor(id, firstName, lastName, position, team, imageUrl, weeklyStats, weeklyValues) {
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.position = position
        this.team = team
        this.imageUrl = imageUrl
        this.weeklyStats = weeklyStats || {}
        this.weeklyValues = weeklyValues || {}
    }

    getStats(week) {
        return this.weeklyStats[week]
    }

    getValue(week) {
        return this.weeklyValues[week]
    }

    setValue(week, value) {
        if (!this.weeklyValues[week]) this.weeklyValues[week] = {}
        this.weeklyValues[week] = value
    }
}

class PlayerValue {
    constructor(playerId, week, value, explanations, firstName, lastName, position) {
        this.id = playerId
        this.week = week
        this.value = value
        this.explanations = explanations
        this.firstName = firstName
        this.lastName = lastName
        this.position = position
    }
}

module.exports = {
    Player,
    PlayerValue
}