const fs = require("fs");
const path = require("path");

function getDeploymentFile() {
  const customFile = process.env.DEPLOYMENT_FILE;
  if (customFile && customFile.trim()) {
    return path.resolve(process.cwd(), customFile.trim());
  }

  return path.resolve(__dirname, "../../../deployments/ganache/GradeManager.json");
}

function readDeployment() {
  const deploymentFile = getDeploymentFile();

  // 后端必须先拿到部署文件，才能知道应该调用哪个合约地址。
  if (!fs.existsSync(deploymentFile)) {
    const error = new Error(
      `Deployment file not found: ${deploymentFile}. Run the deploy script first.`
    );
    error.code = "DEPLOYMENT_FILE_NOT_FOUND";
    throw error;
  }

  const raw = fs.readFileSync(deploymentFile, "utf8");
  const deployment = JSON.parse(raw);

  // 对部署文件做最小校验，避免合约地址或 ABI 缺失导致接口运行异常。
  if (!deployment.address || !Array.isArray(deployment.abi)) {
    throw new Error(`Invalid deployment file: ${deploymentFile}`);
  }

  return deployment;
}

module.exports = {
  getDeploymentFile,
  readDeployment
};
