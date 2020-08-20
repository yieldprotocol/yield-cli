#!/usr/bin/env node

const { ethers, BigNumber } = require('ethers')

const UNIT = BigNumber.from(10).pow(BigNumber.from(27))
const URL = process.env.ETH_RPC_URL
const ILK = ethers.utils.formatBytes32String("ETH-A")

const ERC20 = [
    "function mint(address,uint256)",
    "function burn(address,uint256)",
    "function transfer(address,uint256)",
    "function approve(address,uint256)",
    // plus the WETH method
    "function deposit() public payable",
    "function allowance(address, address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]

const GEMJOIN = [
    "function join(address, uint)",
    "function exit(address usr, uint wad)",
]

const VAT = [
    "function ilks(bytes32 ilk) view returns (tuple(uint256 Art, uint256 rate, uint256 spot, uint256 line, uint256 dust))",
    "function frob(bytes32 i, address u, address v, address w, int dink, int dart)",
    "function hope(address usr)",
]

const UNISWAP = [
    "function sync()",
    "function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 blockTimestampLast)",
]

const divRay = (x, ray) => {
    return UNIT.mul(BigNumber.from(x)).div(BigNumber.from(ray))
}

const logPrice = async (pair) => {
    const reserves = await pair.getReserves();
    const daiRes = BigNumber.from(reserves._reserve0.toString());
    const ethRes = BigNumber.from(reserves._reserve1.toString());

    console.log(`Dai Reserves: ${daiRes}`)
    console.log(`WETH Reserves: ${ethRes}`)
    if (ethRes > 0) {
        console.log(`$ price of ETH: ${daiRes.div(ethRes)}`)
    }
}

// Helper to open a CDP with ETH
const getDai = async (client, _daiTokens) => {
    const user = client.address;
    const vat =  new ethers.Contract(process.env.VAT, VAT, client);
    const weth =  new ethers.Contract(process.env.WETH, ERC20, client);
    const wethJoin =  new ethers.Contract(process.env.WETHJOIN, GEMJOIN, client);
    const daiJoin =  new ethers.Contract(process.env.DAIJOIN, GEMJOIN, client);

    const ilk = await vat.ilks(ILK);
    const spot = ilk.spot;
    const rate = ilk.rate;

    // // this is a 1 time thing
    // await (await vat.hope(daiJoin.address)).wait();
    // await (await vat.hope(wethJoin.address)).wait();

    const _daiDebt = divRay(_daiTokens, rate);
    const _wethTokens = divRay(_daiTokens, spot).mul(2);

    let tx;
    if (await weth.balanceOf(client.address) < _wethTokens) {
        console.log(`Depositing ${_wethTokens}...`)
        tx = await weth.deposit({ value: _wethTokens.toString() })
        await tx.wait()
    }

    if (await weth.allowance(client.address, wethJoin.address) < _wethTokens) {
        console.log("Approving...")
        const maxApproval = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").toString()
        tx = await weth.approve(wethJoin.address, maxApproval)
        await tx.wait()
    }

    // enter collateral 
    console.log("Join...")
    tx = await wethJoin.join(user, _wethTokens)
    await tx.wait()

    console.log(`Frob... Debt: ${_daiDebt}`)
    tx = await vat.frob(ILK, user, user, user, _wethTokens, _daiDebt)
    await tx.wait()

    console.log(`Exit... DAI: ${_daiTokens}`)
    tx = await daiJoin.exit(user, _daiTokens)
    await tx.wait()
}

const provider = new ethers.providers.JsonRpcProvider(URL);

let privateKey = process.env.PRIVATE_KEY
if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey
}
const signer = new ethers.Wallet(privateKey)
const client = signer.connect(provider);

(async () => {
    const WETH_AMT = process.argv[2] || 0
    const DAI_AMT = process.argv[3] || 0

    const pair = new ethers.Contract(process.env.UNISWAP, UNISWAP, client)
    console.log("Price:")
    await logPrice(pair)

    if (WETH_AMT === 0 && DAI_AMT === 0) {
        return
    }

    let value;
    if (WETH_AMT > 0) {
        const weth =  new ethers.Contract(process.env.WETH, ERC20, client);
        value = ethers.utils.parseEther(WETH_AMT);
        const tx = await weth.deposit({value: value.toString()})
        await tx.wait()
        await weth.transfer(pair.address, value);
        console.log(`Transferred ${value} WETH to Uniswap`)
    }

    if (DAI_AMT > 0) {
        const dai =  new ethers.Contract(process.env.DAI, ERC20, client);
        
        value = ethers.utils.parseEther(DAI_AMT);
        let tx;
        if (DAI_AMT > 5000) {
            tx = await dai.mint(pair.address, value)
        } else {
            await getDai(client, value);
            tx = await dai.transfer(pair.address, value)
        }
        await tx.wait()


        console.log(`Transferred ${value} DAI to Uniswap`)
    }

    console.log("Syncing the pair..")
    const tx = await pair.sync()
    await tx.wait()

    console.log("\nAfter:")
    await logPrice(pair)
})()
