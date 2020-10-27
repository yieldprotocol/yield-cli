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

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const VAT = process.env.VAT || '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B'
const TREASURY = process.env.TREASURY || '0xFa21DE6f225c25b8F13264f1bFF5e1e44a37F96E'
const series = {
    'Oct 2020' : {
        pool : process.env.fyDaiLP20Oct || "0x6feb7B2a023C9Bc3ccCdF7c5B5a7b929B9a65E04",
    },
    'Dec 2020' : {
        pool : process.env.fyDaiLP20Dec || "0xF7dB19E0373937A13e4b12287B1C121Dfb2d9BF8",
    },
    'Mar 2021' : {
        pool : process.env.fyDaiLP21Mar || "0xb39221E6790Ae8360B7E8C1c7221900fad9397f9",
    },
    'Jun 2021' : {
        pool : process.env.fyDaiLP21Jun || "0x250f8d88173E0D9b692A9742f54e87E01A9FA54E",
    },
    'Sep 2021' : {
        pool : process.env.fyDaiLP21Sep || "0x8EcC94a91b5CF03927f5eb8c60ABbDf48F82b0b3",
    },
    'Dec 2021' : {
        pool : process.env.fyDaiLP21Dec || "0x5591f644B377eD784e558D4BE1bbA78f5a26bdCd",
    },
}

const ETH = ethers.utils.formatBytes32String("ETH-A")
const RAY = BigNumber.from(10).pow(BigNumber.from(27))
const WAD = BigNumber.from(10).pow(BigNumber.from(18))

const mulRay = (x, ray) => {
    return (BigNumber.from(x)).mul(BigNumber.from(ray)).div(RAY)
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
  console.log(`Treasury Eth:   ${collateral.div(WAD)} (${eth.div(WAD)} Eth)`)

  const savings = await treasury.savings()
  const debt = await treasury.debt()
  console.log(`Treasury Dai:   ${savings.div(WAD)}`)
  console.log(`Treasury Debt:  ${debt.div(WAD)}`)

  let tvl = savings.add(collateral).sub(debt)
  for (name in series) {
    const pool = new ethers.Contract(series[name]['pool'], POOL_ABI, provider)
    const dai = await pool.getDaiReserves()
    console.log(`${name}:       ${dai.div(WAD)}`)
    tvl = tvl.add(dai)
  }
  console.log(`TVL:            ${tvl.div(WAD)}`)
})()
