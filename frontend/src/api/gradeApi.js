const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3001";

async function request(path, options = {}) {
  // 前端统一通过该方法访问后端，集中处理 JSON 解析和错误抛出。
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `请求失败 (${response.status})`);
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const gradeApi = {
  health() {
    // 检查后端、本地链和合约部署状态。
    return request("/api/health");
  },
  getAdmin() {
    // 获取合约管理员地址，用于页面顶部状态展示。
    return request("/api/admin");
  },
  getGrade(studentId) {
    // 按学号查询链上成绩，只读调用不产生交易。
    return request(`/api/grade/${encodeURIComponent(studentId)}`);
  },
  saveGrade(data) {
    // 管理员录入或修改成绩，后端会签名并提交链上交易。
    return request("/api/grade", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  getTxStatus(hash) {
    // 根据交易 Hash 查询交易确认状态。
    return request(`/api/tx/${encodeURIComponent(hash)}`);
  }
};
