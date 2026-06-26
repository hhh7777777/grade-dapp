const { Contract, JsonRpcProvider, Wallet } = require("ethers");
const { getDeploymentFile, readDeployment } = require("./contract");

function getRpcUrl() {
  return process.env.RPC_URL || "http://127.0.0.1:7545";
}

function getChainId() {
  return Number(process.env.CHAIN_ID || 1337);
}

// Create an ethers provider connected to the local Ganache chain.
function getProvider() {
  return new JsonRpcProvider(getRpcUrl(), getChainId());
}

function createAdminWallet(provider) {
  // Prefer .env private key; otherwise use the same mnemonic as the Ganache script.
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
