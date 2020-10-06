'use strict'

const {FANTASY_POSITIONS, ROSTER_POSITIONS} = require('../model/Constants')
const {Lineup} = require('../model/Lineup')

const MAX_SALARY = 50000

module.exports = class {
    constructor() {}

    optimize(players) {
        return this.optimizeWithSalary(players, MAX_SALARY)
    }

    // determine optimal lineup based on configuration and constraints
    // For now just use PPG until we integrate with more granular data and scoring options
    optimizeWithSalary(players, maxSalary) {
        // 1. Group players by position
        const groups = groupBy(players, "position")
        groups[FANTASY_POSITIONS.FLEX] = (groups[FANTASY_POSITIONS.RUNNING_BACK] || [])
            .concat((groups[FANTASY_POSITIONS.WIDE_RECEIVER] || []))
            .concat((groups[FANTASY_POSITIONS.TIGHT_END] || []))

        // 2. Sort the groups by "value"
        Object.entries(groups).forEach(([position, players]) => {
            groups[position] = players.filter(p => p.value > 0)
                .sort((p1, p2) => p2.value - p1.value)
        })

        // 3. Initialize an optimal lineup with the available players and manual overrides
        const optimizedLineup = new OptimizedLineup(groups)

        // 2D matrix where historyMap[X][Y] contains the index that Y was at the last time X moved
        // Used for "resetting" when single position has dropped due to small decrements vs. large decrement in other position
        // TODO - use map across positions for drop comparisons instead of single drop
        let lastPositionDrop = null

        // 4. If over salary then decrement position index with lowest value loss that doesn't overlap
        while (optimizedLineup.getSalaryUsed() > maxSalary) {
            // Get the individual drops at each roster spot sorted by smallest drop
            const positionDrops = Object.keys(ROSTER_POSITIONS)
                .map(rosterPosition => optimizedLineup.progressIndex(optimizedLineup[rosterPosition]))
                .filter(i => i.comparePreviousValue() >= 0.0)

            const sortedByValueDrop = positionDrops
                .sort((a,b) => a.comparePreviousValue() - b.comparePreviousValue())

            // The smallest individual drop across positions
            let minValueDrop = sortedByValueDrop.length > 0 ? sortedByValueDrop[0] : null

            if (minValueDrop === null) break

            // console.log(`Smallest individual drop is roster spot ${minValueDrop.roster} from ${minValueDrop.previousIndex.index} to ${minValueDrop.index} with value ${minValueDrop.comparePreviousValue()}`)

            // Same position has dropped consecutive times
            if (lastPositionDrop === null) {
                lastPositionDrop = minValueDrop.previousIndex
            } else if (minValueDrop.roster === lastPositionDrop.roster) {
                // Compare the total drop of this roster spot to the other drops to see if it would be better to do something else
                const otherPositionDrops = positionDrops.filter(positionDrop => {
                    return positionDrop !== minValueDrop && minValueDrop.compareValue(lastPositionDrop) > positionDrop.comparePreviousValue()
                }).sort((a,b) => a.comparePreviousValue() - b.comparePreviousValue())

                // There is another roster spot that has an individual drop smaller than the total drop at the last position
                if (otherPositionDrops.length > 0) {
                    console.log(`Found other roster spot (${otherPositionDrops[0].roster}) with smaller drop of ${otherPositionDrops[0].comparePreviousValue()} compared to total drop of ${minValueDrop.compareValue(lastPositionDrop)}. Resetting ${minValueDrop.roster} back to ${lastPositionDrop.index}`)
                    // Reset the position that has been consecutively dropping back to where it was when it start dropping
                    optimizedLineup[minValueDrop.roster] = lastPositionDrop

                    // Override the min value drop to the other position that has the smallest overall drop
                    minValueDrop = otherPositionDrops[0]
                    lastPositionDrop = minValueDrop
                }
            } else {
                // New roster position dropped
                lastPositionDrop = minValueDrop
            }

            optimizedLineup[minValueDrop.roster] = minValueDrop
        }

        if (optimizedLineup.emptyRosterSpotsPresent() || optimizedLineup.getSalaryUsed() > maxSalary) {
            throw new Error(`No roster possible with salary ${maxSalary}`)
        }

        return optimizedLineup.toLineup()
    }

    initializeHistoryMap() {
        const map = {}
        Object.values(FANTASY_POSITIONS).forEach(pos1 => {
            const positionMap = {}
            Object.values(FANTASY_POSITIONS).forEach(pos2 => {
                positionMap[pos2] = 0
            })
            map[pos1] = positionMap
        })
        return map
    }

}

// TODO - make this agnostic to position counts??
class OptimizedLineup {
    constructor(players) {
        this.players = players

        // Initialize all indexes to the first valid player for each roster spot
        Object.entries(ROSTER_POSITIONS).forEach(([rosterPosition, fantasyPosition]) => {
            this[rosterPosition] = this.progressIndex(new PositionIndex(-1, rosterPosition, fantasyPosition, null, null))
        })
    }

    emptyRosterSpotsPresent() {
        return Object.keys(ROSTER_POSITIONS).filter(rosterPosition => !this[rosterPosition].player).length > 0
    }

    toLineup() {
        return new Lineup(...(Object.keys(ROSTER_POSITIONS).map(rosterPosition => this[rosterPosition].player)))
    }

    // Return a new index object that would be the next valid player to go to
    progressIndex(positionIndex) {
        // No players at position... shouldn't happen
        if (!this.players[positionIndex.position] || this.players[positionIndex.position].length === 0) return positionIndex

        const previousIndex = positionIndex.index >= 0 ? positionIndex : null
        let newIndex = new PositionIndex(positionIndex.index, positionIndex.roster, positionIndex.position, positionIndex.player, previousIndex)

        do {
            const nextIndex = newIndex.index + 1

            // All remaining players in use from other positions... return original
            if (nextIndex >= this.players[positionIndex.position].length){
                positionIndex.previousIndex = newIndex.player !== positionIndex.player ? previousIndex : null
                return positionIndex
            }

            newIndex.player = this.players[positionIndex.position][nextIndex]
            newIndex.index = nextIndex
        } while(this.isPlayerInUse(newIndex.player))

        return newIndex
    }

    isPlayerInUse(player) {
        return Object.keys(ROSTER_POSITIONS)
            .find(rosterPosition => this[rosterPosition] && this[rosterPosition].player === player)
    }

    getSalaryUsed() {
        return Object.keys(ROSTER_POSITIONS)
            .map(rosterPosition => this[rosterPosition].getCost())
            .reduce((a,b) => a + b, 0)
    }
}

class PositionIndex {
    constructor(index, roster, position, player, previousIndex) {
        this.locked = false
        this.roster = roster
        this.position = position
        this.index = index
        this.player = player
        this.previousIndex = previousIndex
    }

    getCost() {
        return this.player !== null ? this.player.cost : 0
    }

    getValue() {
        return this.player !== null ? this.player.value : 0.0
    }

    compareValue(otherIndex) {
        return otherIndex && otherIndex.index !== this.index ? otherIndex.getValue() - this.getValue() : -1
    }

    comparePreviousValue() {
        return this.compareValue(this.previousIndex)
    }
}

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};