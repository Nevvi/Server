'use strict'

class Game {
    constructor(id, week, homeTeam, awayTeam, attendance, weather) {
        this.id = id
        this.week = week
        this.homeTeam = homeTeam
        this.awayTeam = awayTeam
        this.attendance = attendance
        this.weather = weather
    }
}

module.exports = {
    Game
}