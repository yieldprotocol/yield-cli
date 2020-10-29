#!/usr/bin/env node

const { bignumber, add, subtract, multiply, pow } = require("mathjs")

const buyFYDai = (fyDaiReserves, daiReserves, timeTillMaturity, fyDai) => {
    const Y = bignumber(fyDaiReserves)
    const Z = bignumber(daiReserves)
    const T = bignumber(timeTillMaturity)
    const x = bignumber(fyDai)
    const k = bignumber(1/(4 * 365 * 24 * 60 * 60))    // 1 / seconds in four years
    const g = bignumber(950/1000)
    const t = multiply(k, T)
    const a = subtract(1, multiply(g, t))
    const Za = pow(Z, a)
    const Ya = pow(Y, a)
    const Yxa = pow(subtract(Y, x), a)
    const y = subtract(pow(subtract(add(Za, Ya), Yxa), bignumber(1 / a)), Z)

    return y
};

const sellDai = (fyDaiReserves, daiReserves, timeTillMaturity, dai) => {
    const Y = bignumber(fyDaiReserves)
    const Z = bignumber(daiReserves)
    const T = bignumber(timeTillMaturity)
    const x = bignumber(dai)
    const k = bignumber(1/(4 * 365 * 24 * 60 * 60))    // 1 / seconds in four years
    const g = bignumber(950/1000)
    const t = multiply(k, T)
    const a = subtract(1, multiply(g, t))
    const Za = pow(Z, a)
    const Ya = pow(Y, a)
    const Zxa = pow(add(Z, x), a)
    const y = subtract(Y, pow(subtract(add(Za, Ya), Zxa), bignumber(1 / a)))

    return y
};

const buyDai = (fyDaiReserves, daiReserves, timeTillMaturity, dai) => {
    const Y = bignumber(fyDaiReserves)
    const Z = bignumber(daiReserves)
    const T = bignumber(timeTillMaturity)
    const x = bignumber(dai)
    const k = bignumber(1/(4 * 365 * 24 * 60 * 60))    // 1 / seconds in four years
    const g = bignumber(1000/950)
    const t = multiply(k, T)
    const a = subtract(1, multiply(g, t))
    const Za = pow(Z, a)
    const Ya = pow(Y, a)
    const Zxa = pow(subtract(Z, x), a)
    const y = subtract(pow(subtract(add(Za, Ya), Zxa), bignumber(1 / a)), Y)

    return y
};

const sellFYDai = (fyDaiReserves, daiReserves, timeTillMaturity, fyDai) => {
    const Y = bignumber(fyDaiReserves)
    const Z = bignumber(daiReserves)
    const T = bignumber(timeTillMaturity)
    const x = bignumber(fyDai)
    const k = bignumber(1/(4 * 365 * 24 * 60 * 60))    // 1 / seconds in four years
    const g = bignumber(1000/950)
    const t = multiply(k, T)
    const a = subtract(1, multiply(g, t))
    const Za = pow(Z, a)
    const Ya = pow(Y, a)
    const Yxa = pow(add(Y, x), a)
    const y = subtract(Z, pow(add(Za, subtract(Ya, Yxa)), bignumber(1 / a)))

    return y
};

const removeLiquidity = (fyDaiReserves, realFYDaiReserves, daiReserves, supply, timeTillMaturity, tokens) => {
    const Y = bignumber(fyDaiReserves)
    const RY = bignumber(realFYDaiReserves)
    const Z = bignumber(daiReserves)
    const x = bignumber(tokens)
    const s = bignumber(supply)
    const dai = x.mul(Z).div(s)
    const fyDai = x.mul(RY).div(s)
    const boughtDai = sellFYDai(Y.sub(fyDai), Z.sub(dai), timeTillMaturity, fyDai)
    const total = dai.add(boughtDai)

    return total
};

module.exports = { buyFYDai, sellFYDai, buyDai, sellDai, removeLiquidity }
