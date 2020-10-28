// Script used to return the TVL of the protocol
//
// Run as `node tvl.js`
// Requires having `ethers v5` installed.
// Requires having `@openzeppelin/test-helpers` installed.
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
const fmtEth = ethers.utils.formatEther

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const VAT = process.env.VAT || '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B'
const TREASURY = process.env.TREASURY || '0xFa21DE6f225c25b8F13264f1bFF5e1e44a37F96E'
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

const ETH = ethers.utils.formatBytes32String("ETH-A")
const RAY = BigNumber.from(10).pow(BigNumber.from(27))

const mulRay = (x, ray) => {
    return (BigNumber.from(x)).mul(BigNumber.from(ray)).div(RAY)
}

const toDate = (ts)=> {
    const date = new Date(ts * 1000)
    return `${date.getMonth()}/${date.getFullYear()}`
}

const VAT_ABI = [
    "function urns(bytes32, address) view returns (uint256, uint256)",
    "function ilks(bytes32) view returns (uint256, uint256, uint256, uint256, uint256)",
]

const TREASURY_ABI = [
    "function savings() view returns (uint256)",
    "function debt() view returns (uint256)",
]

const POOL_ABI = [
    "function getDaiReserves() view returns (uint128)",
    "function getFYDaiReserves() view returns (uint128)",
    "function totalSupply() view returns (uint256)",
    "function fyDai() view returns (address)",
]

const FYDAI_ABI = [
    "function maturity() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ENDPOINT)
  const vat = new ethers.Contract(VAT, VAT_ABI, provider)
  const treasury = new ethers.Contract(TREASURY, TREASURY_ABI, provider)
  
  const block = await provider.getBlockNumber()
  console.log(`Getting TVL at block ${block}`)

  const eth = BigNumber.from((await vat.urns(ETH, treasury.address))[0])
  const spot = BigNumber.from((await vat.ilks(ETH))[2])
  const collateral = mulRay(eth, spot)
  console.log(`Treasury Eth:   ${fmtEth(collateral).split('.')[0]} (${fmtEth(eth).split('.')[0]} Eth)`)

  const savings = await treasury.savings()
  const debt = await treasury.debt()
  console.log(`Treasury Dai:   ${fmtEth(savings).split('.')[0]}`)
  console.log(`Treasury Debt:  ${fmtEth(debt).split('.')[0]}`)

  let tvl = savings.add(collateral).sub(debt)
  for (name in series) {
    const pool = new ethers.Contract(series[name]['pool'], POOL_ABI, provider)
    const fyDai = new ethers.Contract(series[name]['fyDai'], FYDAI_ABI, provider)
    const dai = await pool.getDaiReserves()
    const timeToMaturity = Math.floor(await fyDai.maturity() - (Date.now() / 1000))
    console.log()
    console.log(`${name}`)
    console.log(`Dai Reserves:       ${fmtEth(dai).split('.')[0]}`)
    console.log(`FYDai Reserves:     ${fmtEth(await pool.getFYDaiReserves()).split('.')[0]} (${fmtEth(await fyDai.balanceOf(pool.address)).split('.')[0]})`)
    console.log(`Token Supply:       ${fmtEth(await pool.totalSupply()).split('.')[0]}`)
    console.log(`Time to Maturity:   ${timeToMaturity}`)
    tvl = tvl.add(dai)
  }
  console.log()
  console.log(`TVL:                ${fmtEth(tvl).split('.')[0]}`)
})()
