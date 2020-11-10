// Script to list all users onboarded through a proxy
//
// Run as node list_users.js`
// Requires having `ethers v5` installed.
//
// Provide arguments as environment variables:
// - ENDPOINT: The Ethereum node to connect to
// - CONTROLLER: The address of the controller contract
// - PROXY: The address of the proxy contract
// - START_BLOCK: The block to filter events from (default: 0).
//   Do not set this to 0 if using with services like Infura
const ethers = require('ethers')

// defaults to the infura node
const ENDPOINT = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/878c2840dbf943898a8b60b5faef8fe9'
// uses the mainnet deployment
const CONTROLLER = process.env.CONTROLLER || '0xB94199866Fe06B535d019C11247D3f921460b91A'
const PROXY = process.env.PROXY || '0x5cd6b40763f0d79cd2198425c42efc7ae5b18bc7'
const START_BLOCK = /* process.env.START_BLOCK || */ 11065032 // deployed block

const DELEGATE_ABI = [
    "event Delegate(address indexed user, address indexed delegate, bool enabled)",
]

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ENDPOINT)
  const controller = new ethers.Contract(CONTROLLER, DELEGATE_ABI, provider)
  const block = await provider.getBlockNumber()
  console.log(`Getting users for proxy ${PROXY} status at block ${block}`)

  // Get all the times that someone added liquidity, which we know because it is the only Dai transfer to the proxy
  const addedFilter = controller.filters.Delegate(null, PROXY, null);
  let logs = await controller.queryFilter(addedFilter, START_BLOCK)
  const delegations = logs.map((log) => {
      return {
          txhash: log.transactionHash,
          user: log.args.user,
          enabled: log.args.enabled,
      }
  })

  for (entry in delegations) {
      console.log(delegations[entry])
  }
})()
