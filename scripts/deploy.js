const fs = require("fs/promises");
const path = require("path");
const hre = require("hardhat");

async function main() {
  // 使用 Hardhat 获取合约工厂，并由默认账户部署 GradeManager 合约。
  const factory = await hre.ethers.getContractFactory("GradeManager");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  // 部署后导出合约地址和 ABI，后端会读取该文件完成合约连接。
  const address = await contract.getAddress();
  const artifact = await hre.artifacts.readArtifact("GradeManager");
  const deployment = {
    network: hre.network.name,
    address,
    abi: artifact.abi,
    deployedAt: new Date().toISOString()
  };

  const outputDir = path.resolve(__dirname, "..", "deployments", hre.network.name);
  const outputFile = path.join(outputDir, "GradeManager.json");

  // 将部署结果写入 deployments/localhost/GradeManager.json，方便前后端联调。
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

  console.log(`GradeManager deployed to ${address}`);
  console.log(`Deployment artifact saved to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
