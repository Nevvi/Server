'use strict'

module.exports = class {
    constructor(json) {
        this.id = json.id
        this.title = json.n
        this.cost = json.fpp
        this.prizes = json.po
        this.lobbySize = json.nt
        this.maxLobbySize = json.m
        this.startTime = json.sdstring
    }
}