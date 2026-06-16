const { Contract, JsonRpcProvider, Wallet } = require("ethers");
const { getDeploymentFile, readDeployment } = require("./contract");

function getRpcUrl() {
  return process.env.RPC_URL || "http://127.0.0.1:8545";
}

function getChainId() {
  return Number(process.env.CHAIN_ID || 31337);
}

// 创建 ethers Provider，后端通过它连接 Hardhat 本地测试链。
function getProvider() {
  return new JsonRpcProvider(getRpcUrl(), getChainId());
}

function createAdminWallet(provider) {
  // 优先使用 .env 中的私钥；未配置时使用 Hardhat 默认助记词，便于本地演示。
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (privateKey && privateKey.trim()) {
    return new Wallet(privateKey.trim(), provider);
  }

  const mnemonic = process.env.ADMIN_MNEMONIC || "test test test test test test test test test test test junk";
  return Wallet.fromPhrase(mnemonic).connect(provider);
}

// 根据部署文件中的 ABI 和地址创建合约实例。
function createContract(runner) {
  const deployment = readDeployment();
  return new Contract(deployment.address, deployment.abi, runner);
}

// 只读合约实例用于查询，不会产生交易费用。
function getReadContract() {
  const provider = getProvider();
  return createContract(provider);
}

// 写入合约实例绑定管理员钱包，用于录入或修改成绩。
function getWriteContract() {
  const provider = getProvider();
  const signer = createAdminWallet(provider);
  return createContract(signer);
}

module.exports = {
  getRpcUrl,
  getChainId,
  getProvider,
  getDeploymentFile,
  getReadContract,
  getWriteContract,
  createAdminWallet
};
