#!/usr/bin/env node

const { BigNumber, ethers } = require('ethers')

const maturity = 1629514013;
var rate = 1.05
var daiBalance = 1000

const tokensToAdd = (
    maturity, 
    rate, 
    daiBalance
  ) =>{
    const YEAR = 60*60*24*365;
    var fromDate = Math.round((new Date()).getTime() / 1000);
    const secsToMaturity = maturity - fromDate;
    const propOfYear = secsToMaturity/YEAR;
    const price = 1 / Math.pow(rate, propOfYear);
    return daiBalance/price - daiBalance;

  };

console.log(tokensToAdd(maturity, rate, daiBalance));
