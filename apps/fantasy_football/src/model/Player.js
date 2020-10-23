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

module.exports = {
    Player
}