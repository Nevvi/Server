'use strict'

module.exports = class {
    constructor() {}

    // determine optimal lineup based on configuration and constraints
    // For now just use PPG until we integrate with more granular data and scoring options
    optimize(players, configuration) {
        // 1. Group players by position
        const groups = groupBy(players, "position")

        // 2. Sort the groups by "value" (value = PPG for now)
        Object.values(groups).forEach(positionGroup => {
            positionGroup.sort((p1, p2) => p2.pointsPerGame - p1.pointsPerGame)
        })
        console.log(groups)

        // 2. Pre-select top players in each position (don't overlap)
        // TODO - flex
        const qbs = groups['QB'].slice(0, configuration.qbCount)
        const rbs = groups['RB'].slice(0, configuration.rbCount)
        const wrs = groups['WR'].slice(0, configuration.wrCount)
        const tes = groups['TE'].slice(0, configuration.teCount)
        const defenses = groups['DST'].slice(0, configuration.defenseCount)

        // 3. If over salary then decrement position with lowest value loss
        // 4. Repeat (3) until under or at salary cap

        return [...qbs, ...rbs, ...wrs, ...tes, ...defenses]
    }
}

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};