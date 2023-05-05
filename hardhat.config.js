require("@nomicfoundation/hardhat-toolbox");
require("hardhat-flat-exporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  flattenExporter: {
    src: "./contracts",
    path: "./flat",
    clear: true,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  networks: {
    mumbai: {
      url: process.env.NETWORK_MUMBAI_URL,
      accounts: [process.env.PRIVATE_KEY_ACCOUNT],
    },
  },
};
