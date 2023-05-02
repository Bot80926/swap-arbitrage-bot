# swap-arbitrage-bot ![](https://img.shields.io/badge/license-ISC-blue) ![](https://img.shields.io/badge/version-v1.0.0-blue) ![](https://img.shields.io/badge/ethers-v5.5.3-blue) ![](https://img.shields.io/badge/nodejs-passing-brightgreen)

介绍
- 在去中心化交易所上的swap套利夹子机器人， 让你零成本套利。
- 在 KCC链上的 [MojitoSwap](https://app.mojitoswap.finance/) 通过了测试用例并能够正常运行
- 当然你可以手动更改配置，让脚本能够在任何evm兼容链上运行。
- 祝你玩得愉快 😎

EN-Intro
- DEX-swap arbitrage bot. help you make profit with zero cost 
- It's pass test cases & running well on [MojitoSwap](https://app.mojitoswap.finance/), which is built on KuCoin Community Chain(KCC).
- Also you can modify the configuration manually, the script can run in any other EVM chains.
- Have fun! 


## Installation

```
npm install
```

## Run the script

```
node bot.js
```

## Config

```
const secretKey = "input your private key here"
const blackAddress = "input your wallet address here";

//Slippage refers to the difference between the expected price of a trade and the price at which the trade is executed
const slippage = 0.005

//buyAmount how much are we going to pay for example 0.1 KCS
const buyAmount = 3

// and you need to double check all contract address for safu :)
```

## Maintainers

[@Bot80926](https://github.com/Bot80926)

[中文博客讲解](https://blog.csdn.net/qq_31915745?type=blog)
