#!/usr/bin/env node

const { ethers, BigNumber } = require('ethers')

const URL = process.env.ETH_RPC_URL

const PROXYREGISTRY = [
    "function build(address)",
    "function proxies(address) view returns (address)",
]

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider);

(async () => {

    // which user to build for
    const USER = process.argv[2]
    if (USER === undefined) {
        console.error("Please include an argument with the user address you want to create a proxy for")
    }

    const registry = new ethers.Contract(process.env.PROXYREGISTRY, PROXYREGISTRY, client)

    console.log("Building the proxy...")
    await registry.build(USER)
    await tx.wait()

    console.log(`${ await registry.proxies(USER) }`)
})()
