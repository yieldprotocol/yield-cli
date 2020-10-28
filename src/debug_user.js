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
const fmtEth = ethers.utils.formatEther

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const CONTROLLER = process.env.CONTROLLER || '0xb94199866fe06b535d019c11247d3f921460b91a'
const START_BLOCK = process.env.START_BLOCK || 11065103 // deployed block

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

// which user to debug for
const USER = process.env.ADDRESS
if (USER === undefined) {
    console.error("Please set the ADDRESS environment variable with the user you want to inspect")
}

const ABI = [
    "event Posted(bytes32 indexed collateral, address indexed user, int256 amount)",
    "event Borrowed(bytes32 indexed collateral, uint256 indexed maturity, address indexed user, int256 amount)",

    "function seriesIterator(uint256 i) view returns (uint256)",
    "function posted(bytes32, address) view returns (uint256)",
    "function locked(bytes32, address) view returns (uint256)",
    "function debtFYDai(bytes32, uint256, address) view returns (uint256)",
    "function debtDai(bytes32, uint256, address) view returns (uint256)",
    "function isCollateralized(bytes32, address) view returns (bool)",
    "function powerOf(bytes32, address) view returns (uint256)",
    "function totalDebtDai(bytes32, address) view returns (uint256)",
]

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
]

const toDate = (ts)=> {
    const date = new Date(ts * 1000)
    return `${date.getMonth()}/${date.getFullYear()}`
}

const CHAI = ethers.utils.formatBytes32String("CHAI")
const ETH = ethers.utils.formatBytes32String("ETH-A")

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ENDPOINT)
  const controller = new ethers.Contract(CONTROLLER, ABI, provider)
  const block = await provider.getBlockNumber()
  console.log(`Getting user ${USER} status at block ${block}`)
  console.log(`Controller: ${controller.address}\n`)

  // Get all the times they posted and borrowed
  /* const postedFilter = controller.filters.Posted(null, USER);
  let logs = await controller.queryFilter(postedFilter, START_BLOCK)
  const posted = logs.map((log) => {
      return {
          txhash: log.transactionHash,
          collateral: log.args.collateral,
          amount: log.args.amount.toString(),
      }
  })

  const borrowedFilter = controller.filters.Borrowed(null, null, USER);
  logs = await controller.queryFilter(borrowedFilter, START_BLOCK)
  const borrowed = logs.map((log) => {
      return {
          user: log.args.user,
          txhash: log.transactionHash,
          collateral: ethers.utils.parseBytes32String(log.args.collateral),
          maturity: toDate(log.args.maturity.toString()),
          amount: log.args.amount.toString(),
      }
  }) */

  console.log("User provider status:\n")
  for (name in series) {
    const pool = new ethers.Contract(series[name]['pool'], ERC20_ABI, provider)
    const balance = await pool.balanceOf(USER)
    console.log(`	${name}: ${fmtEth(balance)} LP Tokens`)
  }
  console.log() // newline

  for (const collateral of [CHAI, ETH]) {
      const ticker = ethers.utils.parseBytes32String(collateral)
      console.log(`Getting ${ticker} collateral info...`)
      const posted = await controller.posted(collateral, USER)
      const locked = await controller.locked(collateral, USER)
      const isOK = await controller.isCollateralized(collateral, USER)
      const borrowingPower = await controller.powerOf(collateral, USER)
      const totalDebtDai = await controller.totalDebtDai(collateral, USER)

      console.log("Is healthy?", isOK)
      console.log(`Total debt: ${fmtEth(totalDebtDai)} DAI`)
      console.log(`Can borrow: ${fmtEth(borrowingPower.sub(totalDebtDai))} DAI`)

      console.log(`Posted: ${fmtEth(posted)} ${ticker}`)
      console.log(`Locked: ${fmtEth(locked)} ${ticker}\n`)

      console.log("Getting per FYDai maturity info...")
      for (let i = 0; i < 6; i++) { // 6 fydai series
          const maturity = await controller.seriesIterator(i)
          console.log(`\tMaturity: ${toDate(maturity)}`)
          const debt = await controller.debtFYDai(collateral, maturity, USER)
          const inDai = await controller.debtDai(collateral, maturity, USER)
          console.log(`\tOwed: ${fmtEth(debt)} FYDAI (${fmtEth(inDai)} DAI)`)
          console.log() // newline
      }
  }

  /* 
    console.log("History")
    console.log("User posted logs:")
    console.log(posted)

    console.log("User borrowed logs:")
    console.log(borrowed)
  */
})()
