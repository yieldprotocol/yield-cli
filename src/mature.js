#!/usr/bin/env node

const { BigNumber, ethers } = require('ethers')

const URL = process.env.ETH_RPC_URL

const YDAI = [
    "function maturity() view returns (uint256)",
    "function isMature() view returns(bool)",
    "function mature()",
    "function name() view returns (string)"
]

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider);


(async () => {
    const MATURE = process.argv[2] || ''
    //const DAI_AMT = process.argv[3] || ''
    const user = client.address

    let tx;
    const ydai = new ethers.Contract(process.env.YDAI, YDAI, client);
    const name = await ydai.name(); 
    const maturity = await ydai.maturity();
    var isMature = await ydai.isMature();
    const msg = (isMature) ? "mature" : "is not mature";
    const block = await provider.getBlockNumber();
    const timestamp = (await provider.getBlock(block)).timestamp;


    if (MATURE == 'mature'){
        console.log(`Maturing YDAI: ${name}`);
        tx = await ydai.mature();
        await tx.wait();
        console.log(`YDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    } else {
        console.log(`YDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    }

})()