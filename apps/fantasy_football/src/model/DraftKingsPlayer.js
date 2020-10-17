'use strict'

module.exports = class {
    constructor(json) {
        this.id = json.pid
        this.firstName = json.fn
        this.lastName = json.ln
        this.position = json.pn // RB, WR, etc.
        this.status = json.i // IR = Injured Reserve, Q = Questionable, PPD = Postponed, etc.
        this.cost = json.s
        this.pointsPerGame = parseFloat(json.ppg)
        this.isDisabled = json.IsDisabledFromDrafting
    }
}