const assert = require("assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ganache = require("ganache");
const { BrowserProvider, ContractFactory } = require("ethers");

const rootDir = path.resolve(__dirname, "..");
const artifactFile = path.join(
  rootDir,
  "artifacts",
  "contracts",
  "GradeManager.sol",
  "GradeManager.json"
);

function getArtifact() {
  if (!fs.existsSync(artifactFile)) {
    execFileSync(process.execPath, [path.join(rootDir, "scripts", "compile.js")], {
      cwd: rootDir,
      stdio: "inherit"
    });
  }

  return JSON.parse(fs.readFileSync(artifactFile, "utf8"));
}

async function deployFixture() {
  const ganacheProvider = ganache.provider({
    logging: {
      quiet: true
    },
    chain: {
      chainId: 1337
    },
    wallet: {
      mnemonic: "test test test test test test test test test test test junk"
    }
  });
  const provider = new BrowserProvider(ganacheProvider);
  const admin = await provider.getSigner(0);
  const other = await provider.getSigner(1);
  const artifact = getArtifact();
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, admin);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  return { admin, other, contract };
}

async function assertReverts(promise, reason) {
  await assert.rejects(promise, (error) => {
    const message = [
      error.shortMessage,
      error.reason,
      error.message,
      JSON.stringify(error.info || {})
    ].join("\n");
    return message.includes(reason);
  });
}

describe("GradeManager", function () {
  it("sets the deployer as the admin", async function () {
    const { admin, contract } = await deployFixture();
    assert.strictEqual(await contract.getAdmin(), await admin.getAddress());
  });

  it("allows the admin to create and update grades", async function () {
    const { contract } = await deployFixture();

    const tx = await contract.setGrade("2023001", "Alice", 88, "Math");
    const receipt = await tx.wait();
    const eventLog = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch (error) {
          return null;
        }
      })
      .find((event) => event?.name === "GradeUpserted");

    assert.ok(eventLog);
    assert.strictEqual(eventLog.args.studentName, "Alice");
    assert.strictEqual(Number(eventLog.args.score), 88);

    const first = await contract.getGrade("2023001");
    assert.strictEqual(first[0], true);
    assert.strictEqual(first[1], "2023001");
    assert.strictEqual(first[2], "Alice");
    assert.strictEqual(Number(first[3]), 88);
    assert.strictEqual(first[4], "Math");

    await (await contract.setGrade("2023001", "Alice", 92, "Updated")).wait();
    const second = await contract.getGrade("2023001");
    assert.strictEqual(Number(second[3]), 92);
    assert.strictEqual(second[4], "Updated");
  });

  it("blocks non-admin writes", async function () {
    const { contract, other } = await deployFixture();
    await assertReverts(
      contract.connect(other).setGrade("2023002", "Bob", 75, "English"),
      "Only admin can modify grades"
    );
  });

  it("returns a clean empty result when the grade does not exist", async function () {
    const { contract } = await deployFixture();
    const result = await contract.getGrade("404");
    assert.strictEqual(result[0], false);
    assert.strictEqual(result[1], "");
    assert.strictEqual(result[2], "");
    assert.strictEqual(Number(result[3]), 0);
    assert.strictEqual(result[4], "");
  });

  it("rejects invalid scores", async function () {
    const { contract } = await deployFixture();
    await assertReverts(
      contract.setGrade("2023003", "Carol", 101, "Invalid"),
      "Score must be between 0 and 100"
    );
  });
});
