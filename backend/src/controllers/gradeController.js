const {
  getHealthSnapshot,
  queryGrade,
  upsertGrade,
  getTransactionStatus,
  getAdminAddress
} = require("../services/contractService");
const { success, failure } = require("../utils/response");

function normalizeText(value) {
  // 统一清理用户输入，减少空格导致的无效请求。
  return typeof value === "string" ? value.trim() : "";
}

function parseScore(value) {
  // 分数可能从前端以字符串形式传入，这里统一转换为数字。
  const score = Number(value);
  return Number.isFinite(score) ? score : NaN;
}

function isAdminError(error) {
  // 合约权限错误会被 ethers 包装成不同字段，这里统一识别为管理员权限失败。
  const message = `${error?.reason || error?.shortMessage || error?.message || ""}`.toLowerCase();
  return message.includes("only admin") || message.includes("unauthorized");
}

async function health(req, res) {
  // 健康检查接口：用于确认后端、本地链和已部署合约的连接状态。
  const data = await getHealthSnapshot();
  return success(res, data.ready ? "后端和链路连接正常" : "后端已启动，但链路未就绪", data);
}

async function admin(req, res) {
  try {
    const adminAddress = await getAdminAddress();
    return success(res, "已获取管理员地址", { adminAddress });
  } catch (error) {
    return failure(res, "获取管理员地址失败", 503, error.message);
  }
}

async function getGrade(req, res) {
  const studentId = normalizeText(req.params.studentId);
  if (!studentId) {
    return failure(res, "学号不能为空", 400);
  }

  try {
    // 查询接口只读取链上数据，不产生交易。
    const grade = await queryGrade(studentId);
    if (!grade.exists) {
      return success(res, "暂无该学号成绩记录", grade);
    }

    return success(res, "成绩查询成功", grade);
  } catch (error) {
    return failure(res, "查询成绩失败", 503, error.message);
  }
}

async function saveGrade(req, res) {
  // 写入接口负责参数校验、交易签名、合约调用和结果返回。
  const studentId = normalizeText(req.body.studentId);
  const studentName = normalizeText(req.body.studentName);
  const remark = normalizeText(req.body.remark);
  const score = parseScore(req.body.score);

  if (!studentId) {
    return failure(res, "学号不能为空", 400);
  }

  if (!studentName) {
    return failure(res, "学生姓名不能为空", 400);
  }

  if (!Number.isFinite(score)) {
    return failure(res, "成绩必须是数字", 400);
  }

  if (score < 0 || score > 100) {
    return failure(res, "成绩必须在 0 到 100 之间", 400);
  }

  try {
    const result = await upsertGrade({
      studentId,
      studentName,
      score,
      remark
    });

    return success(res, "成绩上链成功", result);
  } catch (error) {
    if (isAdminError(error)) {
      return failure(res, "只有管理员可以录入或修改成绩", 403, error.message);
    }

    return failure(res, "成绩上链失败", 503, error.message);
  }
}

async function txStatus(req, res) {
  const txHash = normalizeText(req.params.hash);
  if (!txHash) {
    return failure(res, "交易哈希不能为空", 400);
  }

  try {
    // 交易状态接口可用于前端轮询，也便于报告中展示交易确认过程。
    const status = await getTransactionStatus(txHash);
    const message = status.mined ? "交易已确认" : "交易仍在等待确认";
    return success(res, message, status);
  } catch (error) {
    return failure(res, "查询交易状态失败", 503, error.message);
  }
}

module.exports = {
  health,
  admin,
  getGrade,
  saveGrade,
  txStatus
};
