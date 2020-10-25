'use strict'

const {FANTASY_POSITIONS} = require('../model/Constants')

module.exports.groupAndSortByPosition = (players) => {
    const groups = module.exports.groupBy(players, "position")
    groups[FANTASY_POSITIONS.FLEX] = (groups[FANTASY_POSITIONS.RUNNING_BACK] || [])
        .concat((groups[FANTASY_POSITIONS.WIDE_RECEIVER] || []))
        .concat((groups[FANTASY_POSITIONS.TIGHT_END] || []))

    // 2. Sort the groups by "value"
    Object.entries(groups).forEach(([position, players]) => {
        groups[position] = players.filter(p => p.value > 0)
            .sort((p1, p2) => p2.value - p1.value)
    })

    return groups
}

module.exports.groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};