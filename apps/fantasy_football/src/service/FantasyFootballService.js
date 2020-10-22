'use strict'

const DraftkingsDAO = require('../dao/DraftkingsDAO')
const PlayerDAO = require('../dao/PlayerDAO')
const GameDAO = require('../dao/GameDAO')
const LineupOptimizer = require('./LineupOptimizer')
const PlayerEvaluator = require('./PlayerEvaluator')
const Constants = require('../model/Constants')
const {ValuedPlayer} = require('../model/Player')

module.exports = class PaymentService {
    constructor() {
        this.draftKingsDAO = new DraftkingsDAO()
        this.playerDAO = new PlayerDAO()
        this.gameDAO = new GameDAO()
        this.optimizer = new LineupOptimizer()
        this.playerEvaluator = new PlayerEvaluator(this.playerDAO, this.gameDAO)
    }

    async getPlayer(playerId) {
        return await this.playerDAO.getPlayer(playerId)
    }

    async refreshPlayers() {
        await this.playerDAO.refreshPlayers()
    }

    async refreshGames() {
        await this.gameDAO.refreshGames()
    }

    // TODO - break this out into chunks for SQS queue processing? (doing this for all players could timeout sometimes)
    async loadPlayerStats(week) {
        await this.playerDAO.loadPlayerStats(week)
    }

    async evaluatePlayer(player, week) {
        console.log(`Evaluating player ${player.firstName} ${player.lastName} during week ${week}`)
        const game = await this.gameDAO.getGame(player.team, week)
        const playerValue = game ? await this.playerEvaluator.evaluatePlayer(player, game, week) : {value: 0, explanations: ['Bye week']}
        console.log(`Value for player: ${JSON.stringify(playerValue)}`)
        player.setValue(week, playerValue)
        await this.playerDAO.savePlayerValue(player, week)
    }

    async getContest(contestId) {
        // 1 is the status for NFL
        // TODO - add call in DAO for single contest
        const contests = await this.draftKingsDAO.getContests(Constants.DK_SPORT_CODES.NFL)
        return contests.find(c => c.id === contestId)
    }

    async getContests() {
        // 1 is the status for NFL
        const contests = await this.draftKingsDAO.getContests(Constants.DK_SPORT_CODES.NFL)
        return contests.sort(c => c.startTime)
    }

    async optimize(contest) {
        // TODO - get the pre-computed player values for the week
        // Get all the players in our system and all the players eligible for the given contest
        const [allPlayers, availablePlayers] = await Promise.all([
            this.playerDAO.getAllPlayers(),
            this.draftKingsDAO.getPlayers(contest.draftGroup)
        ])

        // TODO - filter out players if desired
        const filtered = availablePlayers.filter(p => p.status !== "IR" && p.status !== "O" && !p.isDisabled)
        console.log(`Evaluating ${filtered.length} out of ${allPlayers.length} total players`)

        // Combine the DK info with our own info
        const mapped = filtered.map(dkp => {
            if (dkp.position === Constants.POSITIONS.DEFENSE) {
                // TODO - grab team some other way? or store defense as a "PLAYER" in the system
                return new ValuedPlayer(dkp, dkp.pointsPerGame, dkp.cost)
            }

            // Otherwise grab from known players
            const player = allPlayers.find(p =>
                generatePlayerKey(p.firstName, p.lastName, p.position) === generatePlayerKey(dkp.firstName, dkp.lastName, dkp.position)
            )

            // Ideally this never happens...
            if (!player) {
                console.log(`Could not find known player info for DKP ${dkp.firstName} ${dkp.lastName} ${dkp.position}`)
                return null
            }

            // TODO - somehow get week information into here? assume latest week for now
            return new ValuedPlayer(player, dkp.pointsPerGame, dkp.cost)
        }).filter(m => m !== null)

        console.log(`Lost ${filtered.length - mapped.length} players due to bad mapping`)

        return this.optimizer.optimize(mapped)
    }

}

function generatePlayerKey(firstName, lastName, position) {
    return `${firstName.toUpperCase()}_${lastName.toUpperCase()}_${position.toUpperCase()}`
}