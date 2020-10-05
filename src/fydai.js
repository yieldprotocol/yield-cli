#!/usr/bin/env node

const { BigNumber, ethers } = require('ethers')

const URL = process.env.ETH_RPC_URL

const FYDAI = [
    "function maturity() view returns (uint256)",
    "function isMature() view returns(bool)",
    "function mature()",
    "function name() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function redeem(address, address, uint256)"
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
    let value;
    const fyDai = new ethers.Contract(process.env.FYDAI, FYDAI, client);
    const name = await fyDai.name(); 
    const maturity = await fyDai.maturity();
    var isMature = await fyDai.isMature();
    const msg = (isMature) ? "mature" : "is not mature";
    const block = await provider.getBlockNumber();
    const timestamp = (await provider.getBlock(block)).timestamp;


    if (FUNCTION == 'mature'){
        console.log(`Maturing FYDAI: ${name}`);
        tx = await fyDai.mature();
        await tx.wait();
        console.log(`FYDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    } else if (FUNCTION == 'balanceOf') {
        const address = (PARAM1 != '') ? PARAM1 : signer.address;
        const balance = ethers.utils.formatEther(await fyDai.balanceOf(address));
        console.log(`Balance of ${address} is ${balance}`); 

    } else if (FUNCTION == 'redeem') {
        console.log(`Redeeming ${PARAM1} FYDAI: ${name}`);
        value = ethers.utils.parseEther(PARAM1);
        tx = await fyDai.redeem(signer.address, signer.address, value);
        await tx.wait();

    } else {
        console.log(`FYDAI: ${name} is ${msg}.\nMaturity:${maturity}\nCurrent Blockchain Time:${timestamp}`)
    }

})()