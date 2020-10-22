'use strict'

module.exports = class {
    constructor(playerDao, gameDao) {
        this.playerDao = playerDao
        this.gameDao = gameDao
    }

    // TODO - how to effectively value players for week 1 or with minimal stats?
    async evaluatePlayer(player, game, week) {
        const explanations = []

        // Get baseline (PPG)
        let value = this.getBaselineValue(player, week)
        explanations.push(`${value} for average points per game`)

        // TODO - get information about teammates (players in same position, players in other positions)
        // TODO - get information about opposing teams (how many points they give up to certain positions, trends, etc.)
        // TODO - get other information about game (home vs. away, weather, etc.)
        // TODO - consider trends for player

        return {value: value, explanations: explanations}
    }

    getBaselineValue(player, week) {
        let totalPoints = 0.0
        let weeksPlayed = 0.0
        for (let i = 1; i < parseInt(week); i++) {
            const weeklyStats = player.getStats(i.toString())

            if (!weeklyStats) continue

            weeksPlayed++
            totalPoints += getPassingPoints(weeklyStats.passingStats)
            totalPoints += getRushingPoints(weeklyStats.rushingStats)
            totalPoints += getReceivingPoints(weeklyStats.receivingStats)
        }

        return weeksPlayed > 0 ? totalPoints / weeksPlayed : 0.0
    }
}

function getPassingPoints(stats) {
    return (stats.yards / 25.0) +
        (stats.touchdowns * 4.0) +
        (stats.interceptions * -2.0)
}

function getRushingPoints(stats) {
    return (stats.yards / 10.0) +
        (stats.touchdowns * 6.0) +
        (stats.fumbles * -2.0)
}

function getReceivingPoints(stats) {
    return (stats.yards / 10.0) +
        (stats.touchdowns * 6.0) +
        (stats.receptions * 1.0) +
        (stats.fumbles * -2.0)
}