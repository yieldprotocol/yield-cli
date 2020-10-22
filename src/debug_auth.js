// Script used to debug the debt status of a user
//
// Run as `ADDRESS=0xYourAddress node debug_user.js`
// Requires having `ethers v5` installed.
//
// Provide arguments as environment variables:
// - ENDPOINT: The Ethereum node to connect to
// - CONTROLLER: The address of the controller contract
// - ADDRESS: The address of the user you are inspecting
// - START_BLOCK: The block to filter events from (default: 0).
//   Do not set this to 0 if using with services like Infura
const ethers = require('ethers')
const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const CONTROLLER = process.env.CONTROLLER || '0xB94199866Fe06B535d019C11247D3f921460b91A'
const PROXY = process.env.PROXY || '0x5cd6b40763f0d79cd2198425c42efc7ae5b18bc7'
const DAI = process.env.DAI || '0x5cd6b40763f0d79cd2198425c42efc7ae5b18bc7'
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

const PERMIT_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
]

const DELEGATE_ABI = [
    "function delegated(address user, address delegate) view returns (bool)",
]

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ENDPOINT)
  const controller = new ethers.Contract(CONTROLLER, DELEGATE_ABI, provider)
  const dai = new ethers.Contract(DAI, PERMIT_ABI, provider)
  const block = await provider.getBlockNumber()
  console.log(`Getting user ${USER} auth at block ${block}`)

  console.log('Onboard')
  console.log('-------')
  const allowance = (await dai.allowance(USER, PROXY)).toString()
  if (allowance === MAX) console.log(`Proxy-Dai permit: MAX`)
  else console.log(`Proxy-Dai permit: ${(await dai.allowance(USER, PROXY)).toString()}`)
  console.log(`Controller-Proxy Delegation: ${(await controller.delegated(USER, PROXY)).toString()}`)

  for (name in series) {
    const fyDai = new ethers.Contract(series[name]['fyDai'], PERMIT_ABI, provider)
    const pool = new ethers.Contract(series[name]['pool'], DELEGATE_ABI, provider)
    const daiAllowance = (await dai.allowance(USER, series[name]['pool'])).toString()
    const fyDaiAllowance = (await fyDai.allowance(USER, PROXY)).toString()

    console.log()
    console.log(name)
    console.log('-------------')
    if (daiAllowance === MAX) console.log(`Pool-Dai permit: MAX`)
    else console.log(`Pool-Dai permit: ${(await dai.allowance(USER, series[name]['pool'])).toString()}`)
    if (fyDaiAllowance === MAX) console.log(`Proxy-fyDai permit: MAX`)
    else console.log(`Proxy-fyDai permit: ${(await fyDai.allowance(USER, PROXY)).toString()}`)
    console.log(`Pool-Proxy Delegation: ${(await pool.delegated(USER, PROXY)).toString()}`)
  }
})()
