#!/usr/bin/env node

const { ethers, BigNumber } = require("ethers")

const toRay = (value) => {
  let exponent = BigNumber.from(10).pow(BigNumber.from(17))
  return BigNumber.from((value) * 10 ** 10).mul(exponent)
}

const ABI = [
    "function file(bytes32,bytes32,uint)"
]

const URL = process.env.ETH_RPC_URL
const ILK = ethers.utils.formatBytes32String("ETH-A")
const SPOT = ethers.utils.formatBytes32String("spot")

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider)

const address = process.env.VAT
const contract = new ethers.Contract(address, ABI, client);

(async () => {
    if (process.argv[2] === undefined) {
        console.log("No amount specified for Vat")
        return
    }

    const amount = parseInt(process.argv[2])
    const spot = Math.floor(2/3 * amount);
    const tx = await contract.file(ILK, SPOT, toRay(spot))
    console.log(`Submitted tx for ${spot} spot, waiting to mine`, tx.hash)
    const receipt = await tx.wait()
    console.log("Mined. Success: ", receipt.status);
})()
