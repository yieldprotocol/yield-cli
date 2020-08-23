# Yield CLI Utils for testnet

Use the 3 scripts to manipulate spot & uniswap while taking loans and collateralize.

You can manually set the addresses for the contracts as well as the RPC URLs and your private
key. Alternatively, you may run `source config` in your terminal to load all the necessary environment
variables.

## Manipulating ETH price on Maker

Run `./src/set_eth_price.js <ETH price in USD>`. This will set the spot price in the `Vat` contract.

## Adjusting the Uniswap price

The liquidator leverages Uniswap flash swaps to execute the liquidation. The swap
is more profitable the higher the price of Ether is on Uniswap. We achieve that by
increasing the DAI reserves relative to the ETH reserves.

`./src/fund_uniswap.js <ETH amount to deposit> <DAI amount to deposit>`

The amount is internally converted to wei, so to supply `1 DAI`, you'd call `./fund_uniswap 0 1`.
Calling the script with no arguments prints the current uniswap reserves for the WETH/DAI pair.

## Borrowing yDAI & posting ETH collaterael

Since there's multiple yDAI deployments, you must choose one by setting the `YDAI`
environment variable. The example below will borrow from YDAI0.

`YDAI=$YDAI0 ./src/control.js <ETH amount to post> <yDAI amount to draw>`

Calling the script with no arguments prints your current debt stats

## Maturing yDAI 

After a yDai reaches maturity, it is available to be matured by calling the `mature()` function. 

The example below will show whether a series is mature.

`YDAI=$YDAI0 ./src/ydai.js`

To mature a series, call the script with the "mature" parameter.

`YDAI=$YDAI0 ./src/ydai.js mature`
