#!/usr/bin/env node

const { ethers, BigNumber } = require("ethers");

const POOL = [
    "function yDai() view returns (address)",
    "function init(uint128 daiIn)",
    "function mint(address from, address to, uint amount)",
    "function totalSupply() view returns (uint256)",
    "function getYDaiReserves() view returns (uint128)",
    "function getDaiReserves() view returns (uint128)"
]


const URL = process.env.ETH_RPC_URL

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider)

//const dai = new ethers.Contract(process.env.DAI, ERC20, client);
const pool = new ethers.Contract(process.env.POOL, POOL, client);


(async () => {
    const FUNCTION = process.argv[2] || ''
    const PARAM1 = process.argv[3] || ''

    if (FUNCTION == 'details'){
        const _yDai = ethers.utils.formatEther(await pool.getYDaiReserves());
        const _Dai = ethers.utils.formatEther(await pool.getDaiReserves());
        console.log(`YDAI Reserves: ${_yDai} \nDai Reserves: ${_Dai}`)
    } else if (FUNCTION == 'mature') {

    }

})()

