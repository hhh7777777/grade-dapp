const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

async function deployFixture() {
  // 每个测试用例都复用同一套部署流程，保证测试之间互不影响。
  const [admin, other] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("GradeManager");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  return { admin, other, contract };
}

describe("GradeManager", function () {
  it("sets the deployer as the admin", async function () {
    // 验证合约部署者是否自动成为唯一管理员。
    const { admin, contract } = await loadFixture(deployFixture);
    expect(await contract.getAdmin()).to.equal(admin.address);
  });

  it("allows the admin to create and update grades", async function () {
    // 管理员可以新增成绩，也可以用同一学号覆盖更新成绩。
    const { contract } = await loadFixture(deployFixture);

    await expect(contract.setGrade("2023001", "Alice", 88, "Math"))
      .to.emit(contract, "GradeUpserted")
      .withArgs("2023001", "Alice", 88, "Math", anyValue, await contract.getAdmin());

    const first = await contract.getGrade("2023001");
    expect(first[0]).to.equal(true);
    expect(first[1]).to.equal("2023001");
    expect(first[2]).to.equal("Alice");
    expect(first[3]).to.equal(88);
    expect(first[4]).to.equal("Math");

    await contract.setGrade("2023001", "Alice", 92, "Updated");
    const second = await contract.getGrade("2023001");
    expect(second[3]).to.equal(92);
    expect(second[4]).to.equal("Updated");
  });

  it("blocks non-admin writes", async function () {
    // 非管理员写入应被 onlyAdmin 权限控制拒绝。
    const { contract, other } = await loadFixture(deployFixture);
    await expect(contract.connect(other).setGrade("2023002", "Bob", 75, "English"))
      .to.be.revertedWith("Only admin can modify grades");
  });

  it("returns a clean empty result when the grade does not exist", async function () {
    // 查询不存在学号时返回合法空结果，便于前端显示“暂无记录”。
    const { contract } = await loadFixture(deployFixture);
    const result = await contract.getGrade("404");
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal("");
    expect(result[2]).to.equal("");
    expect(result[3]).to.equal(0);
    expect(result[4]).to.equal("");
  });

  it("rejects invalid scores", async function () {
    // 成绩必须位于 0 到 100 之间，超出范围应回滚。
    const { contract } = await loadFixture(deployFixture);
    await expect(contract.setGrade("2023003", "Carol", 101, "Invalid"))
      .to.be.revertedWith("Score must be between 0 and 100");
  });
});
