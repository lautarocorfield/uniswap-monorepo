📂 Monorepo Structure
Built with npm Workspaces for optimal dependency management:
```
uniswap-monorepo/  
├── packages/  
│   ├── uniswap-connection/        # Hardhat (Solidity + TypeScript)  
│   │   ├── contracts/             # Core DEX logic (Swap, Liquidity Pools)  
│   │   ├── test/                  # Hardhat + TypeScript tests  
│   │   └── hardhat.config.ts  
│   │  
│   └── uniswap-frontend/          # Next.js 14 (TypeScript + React + Chakra UI)  
│       └── src/         # React hooks  
│  
├── .gitignore           # Optimized for Node/TS monorepos  
└── README.md  
```
🛠️ Core Technologies

| **Area**         | **Tech**                               |
|------------------|----------------------------------------|
| 🔗 Blockchain    | Solidity, Hardhat, Ethers             |
| 💻 Frontend      | Next.js, TypeScript, React, Chakra UI |
| 🧪 Testing       | Hardhat, Jest, React Testing Library  |


# 🌐 SimpleSwap - Minimalist DEX Implementation  

[![Solidity 0.8.0](https://img.shields.io/badge/Solidity-0.8.0-363636?logo=solidity)](https://soliditylang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![DEX](https://img.shields.io/badge/Type-Decentralized%20Exchange-purple)](https://ethereum.org/en/defi/)

## ✨ Features

- 🏦 **Liquidity Pools**: Add/remove liquidity with ERC20 token pairs
- 🔄 **Token Swaps**: Trade between tokens with slippage protection
- 💹 **Price Oracle**: Real-time price feeds for trading pairs
- ⚡ **Gas Efficient**: Optimized for Ethereum mainnet deployment
- 🔒 **Security**: Inherits OpenZeppelin's battle-tested ERC20 standard

## 📜 Contract Documentation

### State Variables

| Variable | Type    | Description                     |
|----------|---------|---------------------------------|
| `token0` | address | First token in trading pair     |
| `token1` | address | Second token in trading pair    |

## 🔧 Core Functions

### 💧 Add Liquidity (`addLiquidity`)

```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

Flow:

* Verifies token pair matches pool configuration
* Calculates optimal deposit amounts
* Mints LP tokens proportional to deposit
* Transfers tokens from sender to pool

Parameters:
Name	Description
tokenA	First token address
amountADesired	Ideal Token A amount to deposit
amountAMin	Minimum acceptable Token A amount (slippage)

### 🏷️ Remove Liquidity (removeLiquidity)
```
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB)
```
Key Mechanics:
* Burns LP tokens
* Returns proportional token amounts
* Enforces minimum output amounts

### 🔄 Token Swap (swapExactTokensForTokens)
```
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint[] memory amounts)
```

Swap Process:

* Validates 2-token path
* Calculates output via getAmountOut
* Enforces minimum received tokens
* Executes atomic swap

###  🔍 View Functions
Price Feed (getPrice)
```
function getPrice(address tokenA, address tokenB) 
    external view returns (uint256 price)
```

Returns price ratio:
```price = (reserveB * 1e18) / reserveA```

Swap Calculator (getAmountOut)
```
function getAmountOut(
    uint amountIn, 
    uint reserveIn, 
    uint reserveOut
) public pure returns (uint256 amount)
```

### 🛡️ Security Considerations
Always verify token pair matches pool configuration
* Use slippage protection (amount*Min parameters)
* Set reasonable deadlines
### 🔗 LINKS

* TokenA (TOKA)
  https://sepolia.etherscan.io/address/0x6B5900a635970E90b6Fd87b31e44ADc1C9C700b0
* TokenB (TOKB)
  https://sepolia.etherscan.io/address/0xFced11AECDC305aebb442d1b44dfF732724F1A92
* SimpleSwap
  https://sepolia.etherscan.io/address/0x3C3077FE6058bADd6d61cBaF412Ad953AF74D2aF
* URL dApp
  https://uniswap-monorepo-uniswap-frontend-ecudegy92.vercel.app/

## 📊 Test Coverage
```
-----------------|----------|----------|----------|----------|----------------|
File             |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------|----------|----------|----------|----------|----------------|
 contracts/      |      100 |       80 |      100 |      100 |                |
  SimpleSwap.sol |      100 |    77.78 |      100 |      100 |                |
  TokenA.sol     |      100 |      100 |      100 |      100 |                |
  TokenB.sol     |      100 |      100 |      100 |      100 |                |
-----------------|----------|----------|----------|----------|----------------|
All files        |      100 |       80 |      100 |      100 |                |
-----------------|----------|----------|----------|----------|----------------|
```
