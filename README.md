# 链上学生成绩管理 DApp

这是一个面向《以太链分布式应用开发》课程设计的最小完整项目，包含：

- Solidity 智能合约
- Ganache 本地链部署与测试
- Node.js + Express 后端接口
- React 前端页面
- MetaMask 真实切换用户
- 成绩查询、成绩上链、交易哈希展示和合法无记录提示

## 项目结构

- `contracts/`：智能合约
- `scripts/`：solc 编译、清理和 Ganache 部署脚本
- `test/`：基于 Ganache 的合约测试
- `backend/`：后端服务
- `frontend/`：前端页面
- `deployments/`：部署后生成的合约地址和 ABI
- `docs/`：课程设计说明书和素材

## 运行步骤

### 1. 安装依赖

分别在根目录、`backend`、`frontend` 安装依赖：

```bash
npm install
cd backend

npm install
cd ../frontend
npm install
```

### 2. 编译合约

在项目根目录执行：

```bash
npm run compile
```

编译后会生成：

- `artifacts/contracts/GradeManager.sol/GradeManager.json`
- `frontend/src/contracts/gradeManagerAbi.js`

### 3. 启动 Ganache 本地链

在项目根目录执行：

```bash
npm run node
```

默认配置：

- RPC URL：`http://127.0.0.1:7545`
- Chain ID：`1337`
- 助记词：`test test test test test test test test test test test junk`

### 4. 部署合约

新开一个终端，在项目根目录执行：

```bash
npm run deploy:local
```

部署成功后会在 `deployments/ganache/GradeManager.json` 生成合约地址和 ABI。

### 5. 启动后端

进入 `backend` 目录执行：

```bash
npm run dev
```

也可以在根目录执行：

```bash
npm run dev:backend
```

后端默认连接 `http://127.0.0.1:7545`，链 ID 为 `1337`。

### 6. 启动前端

进入 `frontend` 目录执行：

```bash
npm run dev
```

也可以在根目录执行：

```bash
npm run dev:frontend
```

### 7. 使用 MetaMask 演示“切换用户”

1. 安装 MetaMask 浏览器插件。
2. 在 MetaMask 中添加 Ganache 本地网络：
   - RPC URL：`http://127.0.0.1:7545`
   - Chain ID：`1337`
   - 货币符号：`ETH`
3. 从 `npm run node` 打开的 Ganache 终端复制测试账户私钥。
4. 将第 1 个测试账户导入 MetaMask，作为合约部署者和管理员。
5. 将第 2 个或第 3 个测试账户导入 MetaMask，作为普通用户。
6. 在前端点击“连接 MetaMask”：
   - 当前钱包地址等于合约管理员地址时，可以录入或修改成绩。
   - 当前钱包地址不是管理员地址时，只能查询成绩，不能写入。

## 功能说明

- 合约部署者自动成为系统唯一管理员
- 当前浏览器连接的钱包是谁，系统就认为是谁
- 任意用户可按学号查询成绩
- 只有当前钱包地址等于合约管理员地址时，才可以录入或修改成绩
- 查询不到时会返回合法提示
- 后端提供查询接口和系统状态接口
- 前端通过 MetaMask 直接发起管理员写交易
- 页面展示操作状态、交易哈希、区块号和查询结果

## 测试

在根目录执行：

```bash
npm test
```

合约测试覆盖：

- 管理员身份
- 非管理员写入限制
- 成绩新增和修改
- 查询不存在成绩
- 非法分数校验
