require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { HARDHAT_NETWORK_CHAIN_ID = "31337" } = process.env;

module.exports = {
  // Solidity 编译器版本与优化配置，保证合约可稳定编译和部署。
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Hardhat 内置本地链，chainId 默认为 31337。
    hardhat: {
      chainId: Number(HARDHAT_NETWORK_CHAIN_ID)
    },
    // localhost 网络用于连接已经启动的 hardhat node。
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545"
    }
  },
  // 明确目录结构，便于报告中说明合约、测试和构建产物的位置。
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
