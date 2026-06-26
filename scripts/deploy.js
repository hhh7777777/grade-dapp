const fs = require("fs/promises");
const path = require("path");
const { ContractFactory, JsonRpcProvider, Wallet } = require("ethers");
require("dotenv").config();

const GANACHE_RPC_URL = process.env.RPC_URL || "http://127.0.0.1:7545";
const GANACHE_CHAIN_ID = Number(process.env.CHAIN_ID || 1337);

async function main() {
  const artifactFile = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "GradeManager.sol",
    "GradeManager.json"
  );
  const rawArtifact = await fs.readFile(artifactFile, "utf8");
  const artifact = JSON.parse(rawArtifact);

  const provider = new JsonRpcProvider(GANACHE_RPC_URL, GANACHE_CHAIN_ID);
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const mnemonic = process.env.ADMIN_MNEMONIC;
  let signer;
  if (privateKey && privateKey.trim()) {
    signer = new Wallet(privateKey.trim(), provider);
  } else if (mnemonic && mnemonic.trim()) {
    signer = Wallet.fromPhrase(mnemonic.trim()).connect(provider);
  } else {
    signer = await provider.getSigner(0);
  }

  const network = await provider.getNetwork();
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployment = {
    network: "ganache",
    chainId: Number(network.chainId),
    rpcUrl: GANACHE_RPC_URL,
    address,
    abi: artifact.abi,
    deployer: await signer.getAddress(),
    deployedAt: new Date().toISOString()
  };

  const outputDir = path.resolve(__dirname, "..", "deployments", "ganache");
  const outputFile = path.join(outputDir, "GradeManager.json");

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

  console.log(`GradeManager deployed to ${address}`);
  console.log(`Deployer: ${deployment.deployer}`);
  console.log(`Ganache RPC: ${GANACHE_RPC_URL}`);
  console.log(`Chain ID: ${deployment.chainId}`);
  console.log(`Deployment artifact saved to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
