#!/usr/bin/env node

const { ethers, BigNumber } = require("ethers")

const ERC20 = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",

    "function approve(address,uint256)",
    "function mint(address,uint256)",

    // orchestration stuff only for ydai
    "function orchestration(address, bytes4) view returns (bool)",
    "function orchestrate(address, bool)",
]

const POOL = [
    "function yDai() view returns (address)",
    "function init(uint128 daiIn)",
    "function mint(address from, address to, uint amount)",
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

const dai = new ethers.Contract(process.env.DAI, ERC20, client);
const pool = new ethers.Contract(process.env.POOL, POOL, client);

(async () => {
    const addr = client.address;

    const amt = ethers.utils.parseEther('100000')
    console.log("Initializing", pool.address)

    if ((await pool.totalSupply()).gt(0)) {
        console.log("Pool already initialized")
        return
    }

    let nonce = await provider.getTransactionCount(addr, 'pending')

    let tx;
    if ((await dai.balanceOf(addr)).lt(amt)) {
        console.log("minting dai...")
        tx = await dai.mint(addr, amt, { nonce: nonce })
        console.log(tx.hash)
        nonce += 1
    }

    const allowance = await dai.allowance(addr, pool.address);
    if (allowance.lt(amt)) {
        console.log("approving dai...")
        tx = await dai.approve(pool.address, amt, { nonce: nonce })
        console.log(tx.hash)
        nonce += 1
    }

    tx = await pool.init(amt, { gasLimit: 3e6, nonce: nonce })
    console.log("Pool initialized", tx.hash)
})()
