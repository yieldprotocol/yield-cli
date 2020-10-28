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

    console.log(`Y: ${Y}`)
    console.log(`Z: ${Z}`)
    console.log(`T: ${T}`)
    console.log(`k: ${k}`)
    console.log(`g: ${g}`)
    console.log(`t: ${t}`)
    console.log(`a: ${a}`)
    console.log(`Za: ${Za}`)
    console.log(`Ya: ${Ya}`)
    console.log(`Yxa: ${Yxa}`)
    console.log(`x: ${x}`)
    console.log(`y: ${y}`)
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

    console.log(`Y: ${Y}`)
    console.log(`Z: ${Z}`)
    console.log(`T: ${T}`)
    console.log(`k: ${k}`)
    console.log(`g: ${g}`)
    console.log(`t: ${t}`)
    console.log(`a: ${a}`)
    console.log(`Za: ${Za}`)
    console.log(`Ya: ${Ya}`)
    console.log(`Zxa: ${Zxa}`)
    console.log(`x: ${x}`)
    console.log(`y: ${y}`)
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

    console.log(`Y: ${Y}`)
    console.log(`Z: ${Z}`)
    console.log(`T: ${T}`)
    console.log(`k: ${k}`)
    console.log(`g: ${g}`)
    console.log(`t: ${t}`)
    console.log(`a: ${a}`)
    console.log(`Za: ${Za}`)
    console.log(`Ya: ${Ya}`)
    console.log(`Zxa: ${Zxa}`)
    console.log(`x: ${x}`)
    console.log(`y: ${y}`)
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

    console.log(`Y: ${Y}`)
    console.log(`Z: ${Z}`)
    console.log(`x: ${x}`)
    console.log(`T: ${T}`)
    console.log(`k: ${k}`)
    console.log(`g: ${g}`)
    console.log(`t: ${t}`)
    console.log(`a: ${a}`)
    console.log(`Za: ${Za}`)
    console.log(`Ya: ${Ya}`)
    console.log(`Yxa: ${Yxa}`)
    console.log(`y: ${y}`)
    return y
};

const removeLiquidity = (fyDaiReserves, realFYDaiReserves, daiReserves, supply, timeTillMaturity, tokens) => {
    const Y = bignumber(fyDaiReserves)
    const RY = bignumber(realFYDaiReserves)
    const Z = bignumber(daiReserves)
    const x = bignumber(tokens)
    const s = bignumber(supply)
    console.log(`Y: ${Y}`)
    console.log(`RY: ${RY}`)
    console.log(`Z: ${Z}`)
    console.log(`x: ${x}`)
    console.log(`s: ${s}`)
    const dai = x.mul(Z).div(s)
    const fyDai = x.mul(RY).div(s)
    console.log(`Dai:   ${dai}`)
    console.log(`fyDai: ${fyDai}`)
    console.log()
    const boughtDai = sellFYDai(Y.sub(fyDai), Z.sub(dai), timeTillMaturity, fyDai)
    const total = dai.add(boughtDai)
    console.log(`Total: ${total}`)

    return total
};

(async () => {
    switch (process.argv[2]) {
        case 'buyFYDai':
            console.log()
            console.log('buyFYDai:')
            console.log('--------')
            console.log(buyFYDai(process.argv[3], process.argv[4], process.argv[5], process.argv[6]))        
            break
        case 'sellDai':
            console.log()
            console.log('sellDai:')
            console.log('--------')
            console.log(sellDai(process.argv[3], process.argv[4], process.argv[5], process.argv[6]))        
            break
        case 'buyDai':
            console.log()
            console.log('buyDai:')
            console.log('--------')
            console.log(buyDai(process.argv[3], process.argv[4], process.argv[5], process.argv[6]))        
            break
        case 'sellFYDai':
            console.log()
            console.log('sellFYDai:')
            console.log('--------')
            console.log(sellFYDai(process.argv[3], process.argv[4], process.argv[5], process.argv[6]))        
            break
        case 'removeLiquidity':
            console.log()
            console.log('removeLiquidity:')
            console.log('--------')
            console.log(removeLiquidity(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7], process.argv[8]))        
            break
        default:
            console.log('node pool_trade.js sellDai|buyDai|sellFYDai|buyFYDai fyDaiReserves daiReserves timeTillMaturity tradeSize')
            console.log('node pool_trade.js removeLiquidity fyDaiReserves realFYDaiReserves daiReserves poolSupply timeTillMaturity tokensBurned')
    }
})()
