const fs = require("fs/promises");
const path = require("path");
const solc = require("solc");

const rootDir = path.resolve(__dirname, "..");
const contractFile = path.join(rootDir, "contracts", "GradeManager.sol");
const artifactDir = path.join(rootDir, "artifacts", "contracts", "GradeManager.sol");
const artifactFile = path.join(artifactDir, "GradeManager.json");
const frontendAbiFile = path.join(rootDir, "frontend", "src", "contracts", "gradeManagerAbi.js");

async function main() {
  const source = await fs.readFile(contractFile, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "GradeManager.sol": {
        content: source
      }
    },
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors || [];
  const fatalErrors = errors.filter((error) => error.severity === "error");

  errors.forEach((error) => {
    const writer = error.severity === "error" ? console.error : console.warn;
    writer(error.formattedMessage || error.message);
  });

  if (fatalErrors.length > 0) {
    process.exitCode = 1;
    return;
  }

  const contract = output.contracts?.["GradeManager.sol"]?.GradeManager;
  if (!contract) {
    throw new Error("GradeManager contract output was not produced by solc.");
  }

  const artifact = {
    contractName: "GradeManager",
    sourceName: "contracts/GradeManager.sol",
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
    compiler: {
      name: "solc",
      version: solc.version()
    }
  };

  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(artifactFile, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  const frontendAbi = `export const GRADE_MANAGER_ABI = ${JSON.stringify(contract.abi, null, 2)};\n`;
  await fs.mkdir(path.dirname(frontendAbiFile), { recursive: true });
  await fs.writeFile(frontendAbiFile, frontendAbi, "utf8");

  console.log(`Compiled GradeManager with ${solc.version()}`);
  console.log(`Artifact saved to ${artifactFile}`);
  console.log(`Frontend ABI saved to ${frontendAbiFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
