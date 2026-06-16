require("dotenv").config();

const cors = require("cors");
const express = require("express");
const gradeRoutes = require("./routes/gradeRoutes");

const app = express();
const port = Number(process.env.PORT || 3001);

// 允许前端开发服务器跨端口访问后端 API。
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Grade DApp backend is running",
    data: {
      health: "/api/health",
      gradeQuery: "/api/grade/:studentId",
      gradeUpsert: "/api/grade"
    }
  });
});

app.use("/api", gradeRoutes);

// 未匹配的路由返回 404，避免前端误判为空响应。
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "接口不存在"
  });
});

// 全局异常处理，保证接口错误也能以统一 JSON 返回。
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "服务器内部错误",
    details: error.message
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening on http://127.0.0.1:${port}`);
  });
}

module.exports = app;
