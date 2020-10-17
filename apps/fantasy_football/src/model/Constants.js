'use strict'

const DK_SPORT_CODES = {
    NFL: 1
}

const POSITIONS = {
    QUARTERBACK: "QB",
    RUNNING_BACK: "RB",
    WIDE_RECEIVER: "WR",
    TIGHT_END: "TE",
    DEFENSE: "DST"
}

const FANTASY_POSITIONS = {
    QUARTERBACK: "QB",
    RUNNING_BACK: "RB",
    WIDE_RECEIVER: "WR",
    TIGHT_END: "TE",
    FLEX: "FLEX",
    DEFENSE: "DST"
}

const ROSTER_POSITIONS = {
    QB1: FANTASY_POSITIONS.QUARTERBACK,
    RB1: FANTASY_POSITIONS.RUNNING_BACK,
    RB2: FANTASY_POSITIONS.RUNNING_BACK,
    WR1: FANTASY_POSITIONS.WIDE_RECEIVER,
    WR2: FANTASY_POSITIONS.WIDE_RECEIVER,
    WR3: FANTASY_POSITIONS.WIDE_RECEIVER,
    TE: FANTASY_POSITIONS.TIGHT_END,
    FLEX: FANTASY_POSITIONS.FLEX,
    DST: FANTASY_POSITIONS.DEFENSE
}

module.exports = {
    DK_SPORT_CODES,
    POSITIONS,
    FANTASY_POSITIONS,
    ROSTER_POSITIONS
}