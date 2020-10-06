# Yield CLI Utils for testnet

Use the 3 scripts to manipulate spot & uniswap while taking loans and collateralize.

You can manually set the addresses for the contracts as well as the RPC URLs and your private
key. Alternatively, you may run `source config` in your terminal to load all the necessary environment
variables.

## Installation

```
git clone git@github.com:yieldprotocol/yield-cli.git
yarn
source config
```

Run any of the scripts under `./src`

## Manipulating ETH price on Maker

Run `./src/set_eth_price.js <ETH price in USD>`. This will set the spot price in the `Vat` contract.

## Adjusting the Uniswap price

The liquidator leverages Uniswap flash swaps to execute the liquidation. The swap
is more profitable the higher the price of Ether is on Uniswap. We achieve that by
increasing the DAI reserves relative to the ETH reserves.

`./src/fund_uniswap.js <ETH amount to deposit> <DAI amount to deposit>`

The amount is internally converted to wei, so to supply `1 DAI`, you'd call `./fund_uniswap 0 1`.
Calling the script with no arguments prints the current uniswap reserves for the WETH/DAI pair.

## Borrowing fyDai & posting ETH collateral

Since there's multiple fyDai deployments, you must choose one by setting the `FYDAI`
environment variable. The example below will borrow from FYDAI0.

`FYDAI=$FYDAI0 ./src/control.js <ETH amount to post> <fyDai amount to draw>`

Calling the script with no arguments prints your current debt stats

## Maturing fyDai 

After a fyDai reaches maturity, it is available to be matured by calling the `mature()` function. 

The example below will show whether a series is mature.

`FYDAI=$FYDAI0 ./src/fyDai.js`

To mature a series, call the script with the "mature" parameter.

`FYDAI=$FYDAI0 ./src/fyDai.js mature`

## Calculating interest rates

To calculate the output of any potential trade, call the `pool_trade.js` script.

```
'node pool_trade.js sellDai|buyDai|sellFYDai|buyFYDai fyDaiReserves daiReserves timeTillMaturity tradeSize'
```

## Calculate Interest Rates

Calculate the interest rates for any trade in the pool. Enter token amounts in ether units.

```
node sellDai|buyDai|sellFYDai|buyFYDai fyDaiReserves daiReserves timeTillMaturity tradeSize
> node pool_trade.js buyEDai 132.32 66.465 31556905 1
```

## Initialize Pools

Initialize a pool by providing Dai

1. Obtain the `addrs.json` file with the contract addresses.
2. Edit config with the right network and `addrs.json` file.
3. Make sure you have a `.infuraKey` file with a infura project id.
4. Make sure you have a `.secret` file with your private key (not mnemonic).
5. Make sure you have enough Dai.
6. Execute `source config`.
7. Copy the intended pool address from `addrs.json`.
8. Execute `init_pool.js` with the pool address and the liquidity in Dai

```
~/yield-cli$ ./src/init_pool.js 0xE36d789E550aCA906972Ee12240FFf43190A1f5D 1
Initializing 0xE36d789E550aCA906972Ee12240FFf43190A1f5D
Dai transfer approved 0xfd98ec52e728802d081345b6a9b57e86ea20ae157961d0f9c4a491ab03147b34
Pool initialized 0x62d643f5cb763e559bb582cebc8504c6a9bd6729b29eaf47a72561aa5d124146

```