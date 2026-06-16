const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  // Vite + React 用于前端开发和构建，启动速度快，适合课程设计演示。
  plugins: [react()],
  server: {
    // 允许本机和局域网访问，便于浏览器调试和课堂展示。
    host: "0.0.0.0",
    port: 5173
  }
});
