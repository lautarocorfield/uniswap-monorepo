require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");
require("dotenv").config();

const INFURA_NODO = process.env.NODO; // ESCRIBIR EN LA BLOCKCHAIN
const SEPOLIA_PRIVATE_KEY = process.env.PRKEY; // eL QUE PAGA EL GAS
const ETHERSCAN_API_KEY = process.env.ETHSCAN_KEY; // VERIFICAR EL CONTRATO

module.exports = {
  solidity: "0.8.28",
  gasReporter:{
    enabled: true,
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true,
  },
};