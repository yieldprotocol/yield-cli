#!/usr/bin/env node

const { BigNumber, ethers } = require('ethers')

const URL = process.env.ETH_RPC_URL

const YDAI = [
    "function maturity() view returns (uint256)",
    "function isMature() view returns(bool)",
    "function mature()",
    "function name() view returns (string)",
    "function balanceOf(address) view returns (uint256)"
]

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider);


(async () => {
    const FUNCTION = process.argv[2] || ''
    const PARAM1 = process.argv[3] || ''
    const user = client.address

    let tx;
    const ydai = new ethers.Contract(process.env.YDAI, YDAI, client);
    const name = await ydai.name(); 
    const maturity = await ydai.maturity();
    var isMature = await ydai.isMature();
    const msg = (isMature) ? "mature" : "is not mature";
    const block = await provider.getBlockNumber();
    const timestamp = (await provider.getBlock(block)).timestamp;


    if (FUNCTION == 'mature'){
        console.log(`Maturing YDAI: ${name}`);
        tx = await ydai.mature();
        await tx.wait();
        console.log(`YDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    } else if (FUNCTION == 'balanceOf') {
        const address = (PARAM1 != '') ? PARAM1 : signer.address;
        const balance = ethers.utils.formatEther(await ydai.balanceOf(address));
        console.log(`Balance of ${address} is ${balance}`); 

    } else {
        console.log(`YDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    }

})()