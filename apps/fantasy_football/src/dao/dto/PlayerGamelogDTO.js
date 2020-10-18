'use strict'

class GameStatsDTO {
    constructor(json) {
        this.week = json.week
        this.homeTeam = json.homeTeamAbbreviation
        this.awayTeam = json.awayTeamAbbreviation
    }
}

class PlayerInformationDTO {
    constructor(json) {
        this.id = json.id
        this.firstName = json.firstName
        this.lastName = json.lastName
        this.position = json.position
    }
}

class PlayerTeamDTO {
    constructor(json) {
        this.id = json.id
        this.name = json.abbreviation
    }
}

class PassingStatsDTO {
    constructor(json) {
        this.attempts = json.passAttempts
        this.completions = json.passCmpletions
        this.yards = json.passYards
        this.touchdowns = json.passTD
        this.interceptions = json.passInt
        this.pass20Plus = json.pass20Plus
        this.pass40Plus = json.pass40Plus
        this.sacks = json.passSacks
        this.rating = json.qbRating
    }
}

class RushingStatsDTO {
    constructor(json) {
        this.attempts = json.rushAttempts
        this.yards = json.rushYards
        this.touchdowns = json.rushTD
        this.rush20Plus = json.rush20Plus
        this.rush40Plus = json.rush40Plus
        this.fumbles = json.rushFumbles
    }
}

class ReceivingStatsDTO {
    constructor(json) {
        this.targets = json.targets
        this.receptions = json.receptions
        this.yards = json.recYards
        this.touchdowns = json.recTD
        this.rec20Plus = json.rec20Plus
        this.rec40Plus = json.rec40Plus
        this.fumbles = json.recFumbles
    }

}

module.exports = class {
    constructor(json) {
        this.game = new GameStatsDTO(json.game)
        this.player = new PlayerInformationDTO(json.player)
        this.team = new PlayerTeamDTO(json.team)
        this.passingStats = new PassingStatsDTO(json.stats.passing)
        this.rushingStats = new RushingStatsDTO(json.stats.rushing)
        this.receivingStats = new ReceivingStatsDTO(json.stats.receiving)
    }
}