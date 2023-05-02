/*
 * @LastEditors: Bot80926
 * @Description: Swap bot
 * @LastEditTime: 2023-05-02 22:58:26
 * Copyright (c) 2023 by Bot80926, All Rights Reserved.
 * Buy me a coffee: 0xa1ebF7E97Cfd6939fb90b27567AEBa5904a66630
 */

const express = require("express");
const http = require('http');
const chalk = require('chalk');
const Web3 = require("web3")
const ethers = require("ethers");
const swapAbi = require('./swapAbi.json')
const abi = require('./routerAbi.json')
const app = express();
const PORT = process.env.PORT || 3888;

const isTestnet = true; // bot config flag. if true, use testnet, else use mainnet
const secretKey = "input your private key here"
const blackAddress = "input your wallet address here";

const MJT_ROUTER_ADDRESS = isTestnet ? "0x59a4210Dd69FDdE1457905098fF03E0617A548C5" : "0x8c8067ed3bC19ACcE28C1953bfC18DC85A2127F7";
const KCS_CONTRACT = isTestnet ? "0x6551358EDC7fee9ADAB1E2E49560E68a12E82d9e" : "0x4446Fc4eb47f2f6586f9fAAb68B3498F86C07521";
const wss = isTestnet ? "wss://rpc-ws-testnet.kcc.network" : "wss://rpc-ws-mainnet.kcc.network";
const explore = isTestnet ? "https://scan-testnet.kcc.network/tx/" : "https://explorer.kcc.io/en/tx/"
const web3 = new Web3(wss)

//Slippage refers to the difference between the expected price of a trade and the price at which the trade is executed
const slippage = 0.005

//buyAmount how much are we going to pay for example 0.1 KCS
const buyAmount = 3


function calculate_gas_price(action, amount) {
  if (action === "buy") {
    return amount.add(100000000) // 0.1 Gwei
  } else {
    return amount.sub(100000000) // 0.1 Gwei
  }
}

function router(account) {
  return new ethers.Contract(
    MJT_ROUTER_ADDRESS,
    [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
      'function swapExactTokensForETH (uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
    ],
    account
  );
}

function erc20(account, tokenAddress) {
  return new ethers.Contract(
    tokenAddress,
    [{
        "constant": true,
        "inputs": [{
          "name": "_owner",
          "type": "address"
        }],
        "name": "balanceOf",
        "outputs": [{
          "name": "balance",
          "type": "uint256"
        }],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [{
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [{
          "internalType": "string",
          "name": "",
          "type": "string"
        }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [{
          "name": "_spender",
          "type": "address"
        }, {
          "name": "_value",
          "type": "uint256"
        }],
        "name": "approve",
        "outputs": [{
          "name": "",
          "type": "bool"
        }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
    ],
    account
  );
}

const buyToken = async (account, tokenContract, gasLimit, gasPrice) => {
  //amountOutMin how many token we are going to receive
  let amountOutMin = 0;
  const amountIn = ethers.utils.parseUnits(buyAmount.toString(), 'ether');
  if (parseInt(slippage) !== 0) {
    const amounts = await router(account).getAmountsOut(amountIn, [KCS_CONTRACT, tokenContract]);
    amountOutMin = amounts[1].sub(amounts[1].div(100).mul(`${slippage}`));
  }
  const tx = await router(account).swapExactETHForTokensSupportingFeeOnTransferTokens(
    amountOutMin,
    [KCS_CONTRACT, tokenContract],
    account.address,
    (Date.now() + 1000 * 60 * 10), {
      'value': amountIn,
      'gasLimit': gasLimit,
      'gasPrice': gasPrice,
    }
  );

  const receipt = await tx.wait();
  if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
    console.log(chalk.green(`Transaction ${explore}${receipt.transactionHash} mined, status success`));
  } else if (receipt && receipt.blockNumber && receipt.status === 0) {
    console.log(chalk.red(`Transaction ${explore}${receipt.transactionHash} mined, status failed`));
  } else {
    console.log(`Transaction ${explore}${receipt.transactionHash} not mined`);
  }
}

const sellToken = async (account, tokenContract, gasLimit, gasPrice, value = 100) => {
  const sellTokenContract = new ethers.Contract(tokenContract, swapAbi, account)
  const contract = new ethers.Contract(MJT_ROUTER_ADDRESS, abi, account)
  const accountAddress = account.address
  const tokenBalance = await erc20(account, tokenContract).balanceOf(accountAddress);
  let amountOutMin = 0;
  const amountIn = tokenBalance.mul(value).div(100)
  const amounts = await router(account).getAmountsOut(amountIn, [tokenContract, KCS_CONTRACT]);
  if (parseInt(slippage) !== 0) {
    amountOutMin = amounts[1].sub(amounts[1].mul(`${slippage}`).div(100));
  } else {
    amountOutMin = amounts[1]
  }

  // you can pre approve this contract to spend your tokens, it's can safe some tx time and improve success rate
  // const approve = await sellTokenContract.approve(MJT_ROUTER_ADDRESS, amountIn)
  // const receipt_approve = await approve.wait();
  // if (receipt_approve && receipt_approve.blockNumber && receipt_approve.status === 1) {
  console.log(`Approved ${explore}${receipt_approve.transactionHash}`);
  const swap_txn = await contract.swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn, amountOutMin,
    [tokenContract, KCS_CONTRACT],
    accountAddress,
    (Date.now() + 1000 * 60 * 10), {
      'gasLimit': gasLimit,
      'gasPrice': gasPrice,
    }
  )
  const receipt = await swap_txn.wait();
  if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
    console.log(chalk.green(`Transaction ${explore}${receipt.transactionHash} mined, status success`));
  } else if (receipt && receipt.blockNumber && receipt.status === 0) {
    console.log(chalk.red(`Transaction ${explore}${receipt.transactionHash} mined, status failed`));
  } else {
    console.log(`Transaction ${explore}${receipt.transactionHash} not mined`);
  }
  // }
}

const init = async function () {
  const customWsProvider = new ethers.providers.WebSocketProvider(wss);
  const wallet = new ethers.Wallet(secretKey);
  const account = wallet.connect(customWsProvider)
  const iface = new ethers.utils.Interface(['function    swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)',
    'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline)'
  ])

  customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(async function (transaction) {
      // now we will only listen for pending transaction on mojitoSwap factory
      if (transaction && transaction.to && transaction.to.toLowerCase() === MJT_ROUTER_ADDRESS.toLowerCase() && transaction.from !== blackAddress) {
        const value = web3.utils.fromWei(transaction.value.toString())
        const gasPrice = transaction.gasPrice.toString()
        const gasLimit = transaction.gasLimit.toString()
        // for example we will be only showing transaction that are higher than 30 KCS
        if (value >= 3) {
          console.log("value : ", value);
          console.log("gasPrice : ", gasPrice);
          console.log("gasLimit : ", gasLimit);
          //we can print the sender of that transaction
          console.log("from", transaction.from);
          let result = []
          //we will use try and catch to handle the error and decode the data of the function used to swap the token
          try {
            result = iface.decodeFunctionData('swapExactETHForTokens', transaction.data)
          } catch (error) {
            try {
              result = iface.decodeFunctionData('swapExactETHForTokensSupportingFeeOnTransferTokens', transaction.data)
            } catch (error) {
              try {
                result = iface.decodeFunctionData('swapETHForExactTokens', transaction.data)
              } catch (error) {
                console.log("final err : ", transaction);
              }
            }
          }
          if (result.length > 0) {
            let tokenAddress = ""
            if (result[1].length > 0) {
              tokenAddress = result[1][1]
              console.log("tokenAddress", tokenAddress);
              const buyGasPrice = calculate_gas_price("buy", transaction.gasPrice)
              const sellGasPrice = calculate_gas_price("sell", transaction.gasPrice)
              // after calculating the gas price we buy the token
              console.log("going to buy");
              await buyToken(account, tokenAddress, transaction.gasLimit, buyGasPrice)
              // after buying the token we sell it 
              console.log("going to sell the token");
              await sellToken(account, tokenAddress, transaction.gasLimit, sellGasPrice)
            }
          }
        }
      }
    });
  });

  customWsProvider._websocket.on("error", async (ep) => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(init, 3000);
  });

  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};

init();

//now we create the express server
const server = http.createServer(app);

// we launch the server
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});