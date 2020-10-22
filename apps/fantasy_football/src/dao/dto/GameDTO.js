'use strict'

module.exports = class {
    constructor(json) {
        this.schedule = new ScheduleDTO(json.schedule)
        this.score = new ScoreDTO(json.score)
    }
}

class ScheduleDTO {
    constructor(json) {
        this.id = json.id
        this.week = json.week.toString()
        this.awayTeam = json.awayTeam.abbreviation
        this.homeTeam = json.homeTeam.abbreviation
        this.startTime = json.startTime
        this.attendance = json.attendance
        // this.officials = json.officials
        this.weather = json.weather
    }
}

class ScoreDTO {
    constructor(json) {
    }
}