// Script used to return the TVL of the protocol
//
// Run as `ADDRESS=0xYourAddress node provider_value.js`
// Requires having `ethers v5` installed.
// Requires having `mathjs` installed.
//
// Provide arguments as environment variables:
// - ENDPOINT: The Ethereum node to connect to
// - VAT: The address of the Vat contract
// - TREASURY: The address of the Treasury contract
// - fyDaiLP20Oct: The address of the fyDaiLP20Oct contract
// - fyDaiLP20Dec: The address of the fyDaiLP20Dec contract
// - fyDaiLP21Mar: The address of the fyDaiLP21Mar contract
// - fyDaiLP21Jun: The address of the fyDaiLP21Jun contract
// - fyDaiLP21Sep: The address of the fyDaiLP21Sep contract
// - fyDaiLP21Dec: The address of the fyDaiLP21Dec contract
const { ethers, BigNumber } = require('ethers')
const { bignumber, add, subtract, multiply, pow } = require("mathjs")
const fmtEth = ethers.utils.formatEther

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const series = {
    'October 2020' : {
        fyDai : process.env.fyDai20Oct || "0x92c25C17C0C908E52b16627F353F1004543f8A32",
        pool : process.env.fyDaiLP20Oct || "0x6feb7B2a023C9Bc3ccCdF7c5B5a7b929B9a65E04",
    },
    'December 2020' : {
        fyDai : process.env.fyDai20Dec || "0xF2C9c61487D796032cdb9d57f770121218AC5F91",
        pool : process.env.fyDaiLP20Dec || "0xF7dB19E0373937A13e4b12287B1C121Dfb2d9BF8",
    },
    'March 2021' : {
        fyDai : process.env.fyDai21Mar || "0x3DeCA9aF98F59eD5125D1F697aBAd2aF45036332",
        pool : process.env.fyDaiLP21Mar || "0xb39221E6790Ae8360B7E8C1c7221900fad9397f9",
    },
    'June 2021' : {
        fyDai : process.env.fyDai21Jun || "0xe523442a6c083016E2F430ab0780250ef4438536",
        pool : process.env.fyDaiLP21Jun || "0x250f8d88173E0D9b692A9742f54e87E01A9FA54E",
    },
    'September 2021' : {
        fyDai : process.env.fyDai21Sep || "0x269A30E0fD5231438017dC0438f818A80dC4464B",    
        pool : process.env.fyDaiLP21Sep || "0x8EcC94a91b5CF03927f5eb8c60ABbDf48F82b0b3",
    },
    'December 2021' : {
        fyDai : process.env.fyDai21Dec || "0x9D7e85d095934471a2788F485A3c765d0A463bD7",
        pool : process.env.fyDaiLP21Dec || "0x5591f644B377eD784e558D4BE1bbA78f5a26bdCd",
    },
}

// which user to debug for
const USER = process.env.ADDRESS
if (USER === undefined) {
    console.error("Please set the ADDRESS environment variable with the user you want to inspect")
}

const POOL_ABI = [
    "function getDaiReserves() view returns (uint128)",
    "function getFYDaiReserves() view returns (uint128)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function fyDai() view returns (address)",
]

const FYDAI_ABI = [
    "function maturity() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]

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

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ENDPOINT)
  
  const block = await provider.getBlockNumber()
  console.log(`Getting user ${USER} liquidity provider value at block ${block}\n`)

  for (name in series) {
    const pool = new ethers.Contract(series[name]['pool'], POOL_ABI, provider)
    const fyDai = new ethers.Contract(series[name]['fyDai'], FYDAI_ABI, provider)
    const fyDaiReserves = (await pool.getFYDaiReserves()).toString()
    const fyDaiRealReserves = (await fyDai.balanceOf(pool.address)).toString()
    const daiReserves = (await pool.getDaiReserves()).toString()
    const tokenSupply = (await pool.totalSupply()).toString()
    const timeToMaturity = (Math.floor(await fyDai.maturity() - (Date.now() / 1000))).toString()
    const userBalance = (await pool.balanceOf(USER)).toString()

    console.log(`${name}`)
    console.log(`User Balance:       ${fmtEth(userBalance)}`)
    if (userBalance !== '0') {
        const obtainedDai = removeLiquidity(
            fyDaiReserves,
            fyDaiRealReserves,
            daiReserves,
            tokenSupply,
            timeToMaturity,
            userBalance,
        ).toString().split('.')[0]
        console.log(`Value in Dai:       ${fmtEth(obtainedDai)}`)
    }
    console.log()
  }
})()
