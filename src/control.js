#!/usr/bin/env node

const { BigNumber, ethers } = require('ethers')

const URL = process.env.ETH_RPC_URL
const ILK = ethers.utils.formatBytes32String("ETH-A")

const FYDAI = [
    "function maturity() view returns (uint256)",
]

const ERC20 = [
    "function approve(address,uint256)",
    "function deposit() public payable",

    "function allowance(address, address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]

const CONTROLLER = [
    "function posted(bytes32,address) view returns (uint256)",
    "function powerOf(bytes32,address) view returns (uint256)",
    "function totalDebtDai(bytes32,address) view returns (uint256)",

    "function post(bytes32,address,address,uint256)",
    "function borrow(bytes32,uint256,address,address,uint256)",
]

const logPosition = async (controller, who) => {
    const power = await controller.powerOf(ILK, who)
    const collateral = await controller.posted(ILK, who);
    const debt = await controller.totalDebtDai(ILK, who);

    console.log(`User: ${who}.\nMax Debt: ${power} DAI.\nCurrent debt: ${debt} DAI.\nPosted collateral: ${collateral} ETH\n`)
}

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider);

// Borrows fyDai against ETH
(async () => {
    const WETH_AMT = process.argv[2] || 0
    const DAI_AMT = process.argv[3] || 0
    const user = client.address

    const controller = new ethers.Contract(process.env.CONTROLLER, CONTROLLER, client)
    await logPosition(controller, client.address);

    // Post the WETH
    let value;
    let tx;
    if (WETH_AMT > 0) {
        const weth = new ethers.Contract(process.env.WETH, ERC20, client)
        value = ethers.utils.parseEther(WETH_AMT);

        if (await weth.balanceOf(client.address) < value) {
            console.log("Wrapping to WETH");
            tx = await weth.deposit({ value: value.toString() });
            await tx.wait();
        }

        if (await weth.allowance(client.address, process.env.TREASURY) < value) {
            console.log("Approving...")
            const maxApproval = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").toString()
            tx = await weth.approve(process.env.TREASURY, maxApproval)
            await tx.wait()
        }

        console.log("Posting ETH...")
        tx = await controller.post(ILK, user, user, value )
        await tx.wait()

        console.log(`Posted ${value} ETH as collateral`)
    }

    // open the position
    if (DAI_AMT > 0) {
        const fyDai = new ethers.Contract(process.env.FYDAI, FYDAI, client)
        const maturity = await fyDai.maturity();
        value = ethers.utils.parseEther(DAI_AMT);
        tx = await controller.borrow(ILK, maturity, user, user, value, { from: user });
        await tx.wait()
        console.log(`Borrowed ${value} as collateral from DAI that matures at: ${new Date(parseInt(maturity) * 1000)} (UNIX: ${maturity})`)
    }

    await logPosition(controller, user);
})()
