'use strict'

const {FANTASY_POSITIONS} = require('../model/Constants')

const MAX_SALARY = 50000

module.exports = class {
    constructor() {}

    // determine optimal lineup based on configuration and constraints
    // For now just use PPG until we integrate with more granular data and scoring options
    optimize(players, lineup) {
        // 1. Group players by position
        const groups = groupBy(players, "position")
        groups[FANTASY_POSITIONS.FLEX] = groups[FANTASY_POSITIONS.RUNNING_BACK].concat(groups[FANTASY_POSITIONS.WIDE_RECEIVER]).concat(groups[FANTASY_POSITIONS.TIGHT_END])

        // 2. Sort the groups by "value"
        Object.values(groups).forEach(positionGroup => {
            positionGroup.sort((p1, p2) => p2.getValue() - p1.getValue())
        })

        // 3. Initialize an optimal lineup with the available players and manual overrides
        const optimizedLineup = new OptimizedLineup(lineup, groups)

        // 4. If over salary then decrement position index with lowest value loss that doesn't overlap
        // 5. Repeat (4) until under or at salary cap
        lineup.qb = optimizedLineup.qbIndex.player
        lineup.rb1 = optimizedLineup.rb1Index.player
        lineup.rb2 = optimizedLineup.rb2Index.player
        lineup.wr1 = optimizedLineup.wr1Index.player
        lineup.wr2 = optimizedLineup.wr2Index.player
        lineup.te = optimizedLineup.teIndex.player
        lineup.flex = optimizedLineup.flexIndex.player
        lineup.dst = optimizedLineup.defenseIndex.player
    }
}

// TODO - make this agnostic to position counts??
class OptimizedLineup {
    constructor(lineup, players) {
        this.players = players

        // Initialize all indexes to invalid ones
        this.qbIndex = new PositionIndex(-1, FANTASY_POSITIONS.QUARTERBACK, null, null)
        this.rb1Index = new PositionIndex(-1, FANTASY_POSITIONS.RUNNING_BACK, null, null)
        this.rb2Index = new PositionIndex(-1, FANTASY_POSITIONS.RUNNING_BACK, null, null)
        this.wr1Index = new PositionIndex(-1, FANTASY_POSITIONS.WIDE_RECEIVER, null, null)
        this.wr2Index = new PositionIndex(-1, FANTASY_POSITIONS.WIDE_RECEIVER, null, null)
        this.teIndex = new PositionIndex(-1, FANTASY_POSITIONS.TIGHT_END, null, null)
        this.flexIndex = new PositionIndex(-1, FANTASY_POSITIONS.FLEX, null, null)
        this.defenseIndex = new PositionIndex(-1, FANTASY_POSITIONS.DEFENSE, null, null)

        // If players set manually then add them and lock them in
        if (lineup.qb != null) this.findAndLockIndex(this.qbIndex, lineup.qb, this.players[FANTASY_POSITIONS.QUARTERBACK])
        if (lineup.rb1 != null) this.findAndLockIndex(this.rb1Index, lineup.rb1, this.players[FANTASY_POSITIONS.RUNNING_BACK])
        if (lineup.rb2 != null) this.findAndLockIndex(this.rb2Index, lineup.rb2, this.players[FANTASY_POSITIONS.RUNNING_BACK])
        if (lineup.wr1 != null) this.findAndLockIndex(this.wr1Index, lineup.wr1, this.players[FANTASY_POSITIONS.WIDE_RECEIVER])
        if (lineup.wr2 != null) this.findAndLockIndex(this.wr2Index, lineup.wr2, this.players[FANTASY_POSITIONS.WIDE_RECEIVER])
        if (lineup.te != null) this.findAndLockIndex(this.teIndex, lineup.te, this.players[FANTASY_POSITIONS.TIGHT_END])
        if (lineup.flex != null) this.findAndLockIndex(this.flexIndex, lineup.flex, this.players[FANTASY_POSITIONS.FLEX])
        if (lineup.dst != null) this.findAndLockIndex(this.defenseIndex, lineup.dst, this.players[FANTASY_POSITIONS.DEFENSE])

        // Once players are locked in progress each index to the next valid player
        this.qbIndex = this.progressIndex(this.qbIndex)
        this.rb1Index = this.progressIndex(this.rb1Index)
        this.rb2Index = this.progressIndex(this.rb2Index)
        this.wr1Index = this.progressIndex(this.wr1Index)
        this.wr2Index = this.progressIndex(this.wr2Index)
        this.teIndex = this.progressIndex(this.teIndex)
        this.flexIndex = this.progressIndex(this.flexIndex)
        this.defenseIndex = this.progressIndex(this.defenseIndex)
    }

    findAndLockIndex(positionIndex, player, players) {
        positionIndex.locked = true
        positionIndex.index = players.indexOf(player)
        positionIndex.player = player
    }

    // Return a new index object that would be the next valid player to go to
    progressIndex(positionIndex) {
        console.log("Trying to increment position index", positionIndex)

        if (positionIndex.locked) return positionIndex

        let newIndex, newPlayer, nextIndex = positionIndex.index
        do {
            nextIndex = nextIndex + 1
            console.log(`Trying to increment from ${positionIndex.index} to ${nextIndex}`)

            // All remaining players in use from other positions... return original.
            if (positionIndex.index >= this.players[positionIndex.position].length) return positionIndex

            const previousIndex = positionIndex.index >= 0 ? positionIndex.index : null
            newPlayer = this.players[positionIndex.position][nextIndex]
            newIndex = new PositionIndex(nextIndex, positionIndex.position, newPlayer, previousIndex)
        } while(this.isPlayerInUse(newPlayer))

        return newIndex
    }

    isPlayerInUse(player) {
        return this.qbIndex.player === player ||
            this.rb1Index.player === player ||
            this.rb2Index.player === player ||
            this.wr1Index.player === player ||
            this.wr2Index.player === player ||
            this.teIndex.player === player ||
            this.flexIndex.player === player ||
            this.defenseIndex.player === player
    }

    getSalaryUsed() {
        return this.qbIndex.getCost() + this.rb1Index.getCost() + this.rb2Index.getCost() + this.wr1Index.getCost() + this.wr2Index.getCost() + this.teIndex.getCost() + this.flexIndex.getCost() + this.defenseIndex.getCost()
    }
}

class PositionIndex {
    constructor(index, position, player, previousIndex) {
        this.locked = false
        this.position = position
        this.index = index
        this.player = player
        this.previousIndex = previousIndex
    }

    getCost() {
        return this.player !== null ? this.player.cost : 0
    }

    getValue() {
        return this.player !== null ? this.player.getValue() : 0.0
    }

    compareValue(positionIndex) {
        return positionIndex === this ? -1 : this.getValue() - positionIndex.getValue()
    }
}

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};