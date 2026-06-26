const {
  getDeploymentFile,
  readDeployment
} = require("../config/contract");
const {
  getProvider,
  getReadContract,
  getWriteContract
} = require("../config/chain");

function normalizeGradeResult(result) {
  // ethers 返回的是数组式结果，这里统一转换为前端更容易使用的对象。
  return {
    exists: Boolean(result[0]),
    studentId: result[1] || "",
    studentName: result[2] || "",
    score: Number(result[3] || 0),
    remark: result[4] || "",
    updatedAt: Number(result[5] || 0),
    updatedBy: result[6] || "0x0000000000000000000000000000000000000000"
  };
}

async function getHealthSnapshot() {
  const provider = getProvider();
  // health 接口用于答辩时快速证明“后端、链、合约”三者已经连通。
  const health = {
    ready: false,
    chainId: null,
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:7545",
    deploymentFile: getDeploymentFile(),
    contractAddress: null,
    adminAddress: null,
    message: "Chain connection is not ready"
  };

  try {
    const network = await provider.getNetwork();
    health.chainId = Number(network.chainId);
  } catch (error) {
    // 本地链未启动时也返回清晰状态，避免后端直接崩溃。
    try {
      const deployment = readDeployment();
      health.contractAddress = deployment.address;
    } catch (deploymentError) {
      health.message = `${error.message}; ${deploymentError.message}`;
      return health;
    }

    health.message = error.message || "Failed to connect to the local chain";
    return health;
  }

  try {
    const deployment = readDeployment();
    const contract = getReadContract();
    const adminAddress = await contract.getAdmin();

    health.ready = true;
    health.contractAddress = deployment.address;
    health.adminAddress = adminAddress;
    health.message = "Backend and chain are ready";
  } catch (error) {
    health.message = error.message || "Failed to load contract deployment";
  }

  return health;
}

async function queryGrade(studentId) {
  const contract = getReadContract();
  const result = await contract.getGrade(studentId);
  const grade = normalizeGradeResult(result);

  if (!grade.exists) {
    return grade;
  }

  try {
    // 读取最近一次成绩更新事件，用于在查询结果中补充交易 Hash 和区块号。
    const filter = contract.filters.GradeUpserted(studentId);
    const events = await contract.queryFilter(filter, 0, "latest");
    const latestEvent = events.length > 0 ? events[events.length - 1] : null;

    return {
      ...grade,
      txHash: latestEvent ? latestEvent.transactionHash : null,
      blockNumber: latestEvent ? latestEvent.blockNumber : null
    };
  } catch (error) {
    return {
      ...grade,
      txHash: null,
      blockNumber: null
    };
  }
}

async function upsertGrade({ studentId, studentName, score, remark }) {
  const contract = getWriteContract();
  // 写操作会发起真实交易，等待打包后再把交易结果返回给前端。
  const tx = await contract.setGrade(studentId, studentName, score, remark || "");
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null
  };
}

async function getTransactionStatus(txHash) {
  const provider = getProvider();
  // 根据交易 Hash 查询交易是否已经被本地链确认。
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) {
    return {
      mined: false,
      txHash,
      status: "pending",
      blockNumber: null,
      gasUsed: null,
      contractAddress: null
    };
  }

  return {
    mined: true,
    txHash,
    status: receipt.status === 1 ? "success" : "failed",
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
    contractAddress: receipt.contractAddress || null
  };
}

async function getAdminAddress() {
  const contract = getReadContract();
  return contract.getAdmin();
}

module.exports = {
  getHealthSnapshot,
  queryGrade,
  upsertGrade,
  getTransactionStatus,
  getAdminAddress
};
