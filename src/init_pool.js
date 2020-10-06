#!/usr/bin/env node

const { ethers } = require("ethers")

const ERC20 = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
    "function approve(address,uint256)",
]

const POOL = [
    "function init(uint128 daiIn)",
    "function totalSupply() view returns (uint256)"
]

const URL = process.env.ETH_RPC_URL

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider)

const dai = new ethers.Contract(process.env.DAI, ERC20, client)

;(async () => {
    // ./init_pool poolAddress daiAmount
    const poolAddress = process.argv[2]
    const pool = new ethers.Contract(poolAddress, POOL, client)
    
    const daiAmount = process.argv[3]
    const amt = ethers.utils.parseEther(daiAmount)
    
    const addr = client.address;
    console.log("Initializing", pool.address)

    if ((await pool.totalSupply()).gt(0)) {
        console.log("Pool already initialized")
        return
    }

    let nonce = await provider.getTransactionCount(addr, 'pending')

    let tx;
    const daiBalance = await dai.balanceOf(addr);
    if (daiBalance.lt(amt)) {
        console.log("Not enough dai")
        return
    }

    const allowance = await dai.allowance(addr, pool.address);
    if (allowance.lt(amt)) {
        tx = await dai.approve(pool.address, amt, { nonce: nonce })
        console.log("Dai transfer approved", tx.hash)
        nonce += 1
    }

    tx = await pool.init(amt, { gasLimit: 3e6, nonce: nonce })
    console.log("Pool initialized", tx.hash)
})()