'use strict'

const LineupOptimizer = require('../../src/service/LineupOptimizer')
const Player = require('../../src/model/DraftKingsPlayer')
const {POSITIONS} = require('../../src/model/Constants')

const optimizer = new LineupOptimizer()

test('No players', () => {
    expect.assertions(1)
    try {
        optimizer.optimize([])
    } catch (e) {
        expect(e).toBeDefined()
    }
});

test('1 player at each position but not enough for roster', () => {
    expect.assertions(1)
    try {
        optimizer.optimizeWithSalary([
            generatePlayer(1, POSITIONS.QUARTERBACK, 10.0, 10),
            generatePlayer(2, POSITIONS.RUNNING_BACK, 10.0, 10),
            generatePlayer(3, POSITIONS.WIDE_RECEIVER, 10.0, 10),
            generatePlayer(4, POSITIONS.TIGHT_END, 10.0, 10),
            generatePlayer(5, POSITIONS.DEFENSE, 10.0, 10),
        ], 80)
    } catch (e) {
        expect(e).toBeDefined()
    }
});

test('1 player for each roster spot - enough salary', () => {
    const lineup = optimizer.optimizeWithSalary([
        generatePlayer(1, POSITIONS.QUARTERBACK, 10.0, 10),
        generatePlayer(2, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(3, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(4, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(5, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(6, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(7, POSITIONS.TIGHT_END, 10.0, 10),
        generatePlayer(8, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(9, POSITIONS.DEFENSE, 10.0, 10),
    ], 90)

    expect(lineup.qb.id).toEqual(1)
    expect(lineup.rb1.id).toEqual(2)
    expect(lineup.rb2.id).toEqual(3)
    expect(lineup.wr1.id).toEqual(4)
    expect(lineup.wr2.id).toEqual(5)
    expect(lineup.wr3.id).toEqual(6)
    expect(lineup.te.id).toEqual(7)
    expect(lineup.flex.id).toEqual(8)
    expect(lineup.dst.id).toEqual(9)
});

test('1 player for each roster spot - not enough salary for all positions', () => {
    expect.assertions(1)
    try {
        optimizer.optimizeWithSalary([
            generatePlayer(1, POSITIONS.QUARTERBACK, 10.0, 10),
            generatePlayer(2, POSITIONS.RUNNING_BACK, 10.0, 10),
            generatePlayer(3, POSITIONS.RUNNING_BACK, 10.0, 10),
            generatePlayer(4, POSITIONS.WIDE_RECEIVER, 10.0, 10),
            generatePlayer(5, POSITIONS.WIDE_RECEIVER, 10.0, 10),
            generatePlayer(6, POSITIONS.WIDE_RECEIVER, 10.0, 10),
            generatePlayer(7, POSITIONS.TIGHT_END, 10.0, 10),
            generatePlayer(8, POSITIONS.RUNNING_BACK, 10.0, 10),
            generatePlayer(9, POSITIONS.DEFENSE, 9.0, 10),
        ], 80)
    } catch (e) {
        expect(e).toBeDefined()
    }
});

test('Multiple players in one roster spot', () => {
    const lineup = optimizer.optimizeWithSalary([
        generatePlayer(10, POSITIONS.QUARTERBACK, 10.0, 10),
        generatePlayer(11, POSITIONS.QUARTERBACK, 9.0, 5),
        generatePlayer(20, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(21, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(30, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(31, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(32, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(40, POSITIONS.TIGHT_END, 10.0, 10),
        generatePlayer(50, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(60, POSITIONS.DEFENSE, 10.0, 10),
    ], 85)

    expect(lineup.qb.id).toEqual(11)
    expect(lineup.rb1.id).toEqual(20)
    expect(lineup.rb2.id).toEqual(21)
    expect(lineup.wr1.id).toEqual(30)
    expect(lineup.wr2.id).toEqual(31)
    expect(lineup.wr3.id).toEqual(32)
    expect(lineup.te.id).toEqual(40)
    expect(lineup.flex.id).toEqual(50)
    expect(lineup.dst.id).toEqual(60)
});

test('Multiple players in one roster spot of same value', () => {
    const lineup = optimizer.optimizeWithSalary([
        generatePlayer(10, POSITIONS.QUARTERBACK, 10.0, 10),
        generatePlayer(11, POSITIONS.QUARTERBACK, 9.0, 5),
        generatePlayer(20, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(21, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(30, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(31, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(32, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(40, POSITIONS.TIGHT_END, 10.0, 10),
        generatePlayer(41, POSITIONS.TIGHT_END, 10.0, 10),
        generatePlayer(50, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(60, POSITIONS.DEFENSE, 10.0, 10),
    ], 85)

    expect(lineup.qb.id).toEqual(11)
    expect(lineup.rb1.id).toEqual(50)
    expect(lineup.rb2.id).toEqual(21)
    expect(lineup.wr1.id).toEqual(30)
    expect(lineup.wr2.id).toEqual(31)
    expect(lineup.wr3.id).toEqual(32)
    expect(lineup.te.id).toEqual(41)
    expect(lineup.flex.id).toEqual(40)
    expect(lineup.dst.id).toEqual(60)
});

test('Multiple players in different roster spots - 1 with small jumps 1 with big jumps', () => {
    const lineup = optimizer.optimizeWithSalary([
        generatePlayer(10, POSITIONS.QUARTERBACK, 10.0, 10),
        generatePlayer(11, POSITIONS.QUARTERBACK, 5.0, 5),
        generatePlayer(20, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(21, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(30, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(31, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(32, POSITIONS.WIDE_RECEIVER, 10.0, 10),
        generatePlayer(40, POSITIONS.TIGHT_END, 10.0, 10),
        generatePlayer(50, POSITIONS.RUNNING_BACK, 10.0, 10),
        generatePlayer(60, POSITIONS.DEFENSE, 10.0, 10),
        generatePlayer(61, POSITIONS.DEFENSE, 8.0, 8),
        generatePlayer(62, POSITIONS.DEFENSE, 6.0, 6),
        generatePlayer(63, POSITIONS.DEFENSE, 4.0, 4),
    ], 85)

    expect(lineup.qb.id).toEqual(11)
    expect(lineup.rb1.id).toEqual(20)
    expect(lineup.rb2.id).toEqual(21)
    expect(lineup.wr1.id).toEqual(30)
    expect(lineup.wr2.id).toEqual(31)
    expect(lineup.wr3.id).toEqual(32)
    expect(lineup.te.id).toEqual(40)
    expect(lineup.flex.id).toEqual(50)
    expect(lineup.dst.id).toEqual(60)
});

function generatePlayer(id, position, value, cost) {
    return new Player({pid: id, pn: position, ppg: value, s: cost})
}