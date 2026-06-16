function success(res, message, data = {}, status = 200) {
  // 成功响应统一包含 success、message、data，方便前端稳定解析。
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function failure(res, message, status = 400, details = null) {
  // 错误响应统一格式，便于前端展示清晰的人机交互提示。
  const payload = {
    success: false,
    message
  };

  if (details !== null && details !== undefined) {
    payload.details = details;
  }

  return res.status(status).json(payload);
}

module.exports = {
  success,
  failure
};
