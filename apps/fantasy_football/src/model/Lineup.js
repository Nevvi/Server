'use strict'

const {POSITIONS, FANTASY_POSITIONS} = require('./Constants')

module.exports.Configuration = class {
    constructor() {
        this.qbCount = 1
        this.rbCount = 2
        this.wrCount = 3
        this.teCount = 1
        this.flexCount = 1
        this.defenseCount = 1

        // How many primary positions are used by flex positions
        this.flexPrimaryCount = this.rbCount + this.wrCount + this.teCount
        this.flexPositions = [POSITIONS.RUNNING_BACK, POSITIONS.WIDE_RECEIVER, POSITIONS.TIGHT_END]
    }

    getPositionCount(position) {
        switch (position) {
            case FANTASY_POSITIONS.QUARTERBACK:
                return this.qbCount
            case FANTASY_POSITIONS.RUNNING_BACK:
                return this.rbCount
            case FANTASY_POSITIONS.WIDE_RECEIVER:
                return this.wrCount
            case FANTASY_POSITIONS.TIGHT_END:
                return this.teCount
            case FANTASY_POSITIONS.FLEX:
                return this.flexCount
            case FANTASY_POSITIONS.DEFENSE:
                return this.defenseCount
            default:
                return 0
        }
    }

    // TODO allow overrides
}

module.exports.Lineup = class {
    constructor(qb1, rb1, rb2, wr1, wr2, wr3, te, flex, dst) {
        this.qb = qb1
        this.rb1 = rb1
        this.rb2 = rb2
        this.wr1 = wr1
        this.wr2 = wr2
        this.wr3 = wr3
        this.te = te
        this.flex = flex
        this.dst = dst
    }
}