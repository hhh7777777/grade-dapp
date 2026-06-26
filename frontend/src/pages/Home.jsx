import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, Contract, isAddress } from "ethers";
import { gradeApi } from "../api/gradeApi";
import { GRADE_MANAGER_ABI } from "../contracts/gradeManagerAbi";

function formatTime(timestamp) {
  // 将合约中的 Unix 时间戳格式化为更适合页面展示的中文时间。
  if (!timestamp) {
    return "—";
  }

  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value * 1000));
}

function shortAddress(address) {
  // 地址与交易哈希较长，这里统一缩略显示，避免页面拥挤。
  if (!address) {
    return "—";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toDecimalChainId(chainIdValue) {
  // MetaMask 返回的链 ID 常见为十六进制字符串，这里统一转换。
  if (chainIdValue === null || chainIdValue === undefined || chainIdValue === "") {
    return null;
  }

  if (typeof chainIdValue === "number") {
    return chainIdValue;
  }

  if (typeof chainIdValue === "bigint") {
    return Number(chainIdValue);
  }

  if (typeof chainIdValue === "string") {
    return chainIdValue.startsWith("0x") ? Number.parseInt(chainIdValue, 16) : Number(chainIdValue);
  }

  return null;
}

function getEthereum() {
  // 检测浏览器是否存在 EIP-1193 钱包对象，例如 MetaMask。
  return typeof window !== "undefined" ? window.ethereum : undefined;
}

function SectionHeading({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

function StatusBadge({ tone, children }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export default function Home() {
  // 系统状态：展示后端、本地链、合约地址、管理员地址。
  const [health, setHealth] = useState(null);
  const [adminAddress, setAdminAddress] = useState("");
  const [systemMessage, setSystemMessage] = useState("正在连接后端与本地链...");
  const [systemTone, setSystemTone] = useState("neutral");

  // 钱包状态：页面根据当前浏览器钱包判断用户身份。
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState(null);
  const [walletStatus, setWalletStatus] = useState("未连接钱包");
  const [walletTone, setWalletTone] = useState("neutral");
  const [walletLoading, setWalletLoading] = useState(false);

  // 查询模块：所有访问者都可使用。
  const [queryStudentId, setQueryStudentId] = useState("");
  const [queryState, setQueryState] = useState("idle");
  const [queryMessage, setQueryMessage] = useState("请输入学号后查询链上成绩");
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // 管理员模块：仅管理员钱包允许写入。
  const [adminForm, setAdminForm] = useState({
    studentId: "",
    studentName: "",
    score: "",
    remark: ""
  });
  const [adminState, setAdminState] = useState("idle");
  const [adminMessage, setAdminMessage] = useState("连接 MetaMask 后，系统将自动识别当前钱包是否拥有管理员权限");
  const [adminResult, setAdminResult] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const querySectionRef = useRef(null);
  const adminSectionRef = useRef(null);
  const queryInputRef = useRef(null);
  const adminStudentIdRef = useRef(null);

  const expectedChainId = useMemo(() => toDecimalChainId(health?.chainId), [health]);
  const currentWalletChainId = useMemo(() => toDecimalChainId(walletChainId), [walletChainId]);

  const hasMetaMask = Boolean(getEthereum());
  const isWalletConnected = Boolean(walletAddress);
  const isExpectedChain = expectedChainId !== null && currentWalletChainId === expectedChainId;
  const isAdminWallet =
    isWalletConnected &&
    adminAddress &&
    walletAddress.toLowerCase() === adminAddress.toLowerCase();

  const queryStatusLabel =
    queryState === "success"
      ? "已完成"
      : queryState === "empty"
        ? "无记录"
        : queryState === "error"
          ? "异常"
          : queryState === "loading"
            ? "查询中"
            : "待查询";

  const adminStatusLabel =
    adminState === "success"
      ? "成功"
      : adminState === "error"
        ? "失败"
        : adminState === "loading"
          ? "处理中"
          : "待提交";

  const adminIsReady = useMemo(() => {
    // 管理员录入必须字段完整，同时钱包、网络与身份均校验通过。
    return (
      adminForm.studentId.trim().length > 0 &&
      adminForm.studentName.trim().length > 0 &&
      adminForm.score !== "" &&
      adminForm.remark.trim().length > 0 &&
      !adminLoading &&
      hasMetaMask &&
      isWalletConnected &&
      isExpectedChain &&
      isAdminWallet
    );
  }, [adminForm, adminLoading, hasMetaMask, isWalletConnected, isExpectedChain, isAdminWallet]);

  useEffect(() => {
    refreshHealth();
    refreshAdmin();
    syncWalletState({ requestAccounts: false, silent: true });

    // 进入视口时执行轻量 reveal 动画。
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (elements.length === 0) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return undefined;
    }

    // 钱包账户或网络切换后，页面实时同步身份。
    const handleAccountsChanged = (accounts) => {
      const nextAccount = Array.isArray(accounts) && accounts[0] ? accounts[0] : "";
      setWalletAddress(nextAccount);

      if (!nextAccount) {
        setWalletTone("warning");
        setWalletStatus("钱包已断开，当前仅可进行公开查询");
        return;
      }

      setWalletTone("success");
      setWalletStatus("已切换钱包账户，系统身份已同步更新");
    };

    const handleChainChanged = (chainId) => {
      setWalletChainId(toDecimalChainId(chainId));
      setWalletTone("success");
      setWalletStatus("检测到钱包网络已切换");
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function refreshHealth() {
    try {
      // 检查后端、本地链和部署合约的联通状态。
      const response = await gradeApi.health();
      setHealth(response.data);
      setSystemMessage(response.message);
      setSystemTone(response.data.ready ? "success" : "warning");
    } catch (error) {
      setSystemTone("danger");
      setSystemMessage(error.message);
    }
  }

  async function refreshAdmin() {
    try {
      // 读取管理员地址，用于前端角色识别。
      const response = await gradeApi.getAdmin();
      setAdminAddress(response.data.adminAddress);
    } catch (error) {
      setAdminAddress("");
    }
  }

  async function syncWalletState({ requestAccounts = false, silent = false } = {}) {
    const ethereum = getEthereum();
    if (!ethereum) {
      if (!silent) {
        setWalletTone("warning");
        setWalletStatus("未检测到 MetaMask，请先安装浏览器钱包");
      }
      setWalletAddress("");
      setWalletChainId(null);
      return;
    }

    try {
      setWalletLoading(true);
      const accounts = await ethereum.request({
        method: requestAccounts ? "eth_requestAccounts" : "eth_accounts"
      });
      const chainId = await ethereum.request({ method: "eth_chainId" });
      const nextAccount = Array.isArray(accounts) && accounts[0] ? accounts[0] : "";

      setWalletAddress(nextAccount);
      setWalletChainId(toDecimalChainId(chainId));

      if (!nextAccount) {
        if (!silent) {
          setWalletTone("warning");
          setWalletStatus("尚未授权钱包连接，普通用户仍可直接查询成绩");
        }
        return;
      }

      setWalletTone("success");
      setWalletStatus("钱包连接成功，系统将以当前浏览器钱包地址识别用户身份");
    } catch (error) {
      if (!silent) {
        setWalletTone("danger");
        setWalletStatus(error.message || "钱包连接失败");
      }
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleConnectWallet() {
    // 连接钱包按钮点击处理函数。
    await syncWalletState({ requestAccounts: true, silent: false });
  }

  async function switchToLocalChain() {
    const ethereum = getEthereum();
    if (!ethereum || expectedChainId === null) {
      return;
    }

    const hexChainId = `0x${expectedChainId.toString(16)}`;

    try {
      setWalletLoading(true);
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }]
      });
      await syncWalletState({ requestAccounts: false, silent: true });
      setWalletTone("success");
      setWalletStatus("已切换到本地 Ganache 测试链");
    } catch (error) {
      if (error?.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: "Ganache Localhost",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: [health?.rpcUrl || "http://127.0.0.1:7545"]
            }
          ]
        });
        await syncWalletState({ requestAccounts: false, silent: true });
        setWalletTone("success");
        setWalletStatus("本地 Ganache 测试链已添加到 MetaMask");
        return;
      }

      setWalletTone("danger");
      setWalletStatus(error.message || "切换网络失败");
    } finally {
      setWalletLoading(false);
    }
  }

  async function createWriteContract() {
    // 管理员写入改为由当前 MetaMask 钱包直接签名，保证身份真实。
    if (!health?.contractAddress || !isAddress(health.contractAddress)) {
      throw new Error("未获取到有效的合约地址，请先确认合约已部署");
    }

    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("未检测到 MetaMask，请先安装或启用浏览器钱包");
    }

    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    return new Contract(health.contractAddress, GRADE_MANAGER_ABI, signer);
  }

  function focusQuery() {
    querySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      queryInputRef.current?.focus();
    }, 350);
  }

  async function focusAdmin() {
    adminSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      adminStudentIdRef.current?.focus();
    }, 350);

    if (!isWalletConnected) {
      await syncWalletState({ requestAccounts: true, silent: false });
    }
  }

  async function handleQuerySubmit(event) {
    event.preventDefault();
    const studentId = queryStudentId.trim();
    if (!studentId || queryLoading) {
      return;
    }

    setQueryLoading(true);
    setQueryState("loading");
    setQueryMessage("正在从链上读取成绩...");
    setQueryResult(null);

    try {
      // 查询走后端只读接口，任何访问者都可直接使用。
      const response = await gradeApi.getGrade(studentId);
      const data = response.data;
      setQueryResult(data);

      if (data.exists) {
        setQueryState("success");
        setQueryMessage(response.message);
      } else {
        setQueryState("empty");
        setQueryMessage(response.message);
      }
    } catch (error) {
      setQueryState("error");
      setQueryMessage(error.message);
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleAdminSubmit(event) {
    event.preventDefault();

    if (!hasMetaMask) {
      setAdminState("error");
      setAdminMessage("未检测到 MetaMask，请先安装浏览器钱包");
      return;
    }

    if (!isWalletConnected) {
      setAdminState("error");
      setAdminMessage("请先连接 MetaMask 钱包后再提交成绩");
      return;
    }

    if (!isExpectedChain) {
      setAdminState("error");
      setAdminMessage("当前钱包网络不是本地 Ganache 测试链，请先切换网络");
      return;
    }

    if (!isAdminWallet) {
      setAdminState("error");
      setAdminMessage("当前钱包不是合约管理员地址，因此只能查询，不能录入成绩");
      return;
    }

    if (!adminIsReady) {
      return;
    }

    setAdminLoading(true);
    setAdminState("loading");
    setAdminMessage("正在通过 MetaMask 发起链上交易...");
    setAdminResult(null);

    try {
      const contract = await createWriteContract();
      const tx = await contract.setGrade(
        adminForm.studentId.trim(),
        adminForm.studentName.trim(),
        Number(adminForm.score),
        adminForm.remark.trim()
      );

      setAdminState("loading");
      setAdminMessage(`交易已提交，等待区块确认：${tx.hash}`);

      const receipt = await tx.wait();

      setAdminResult({
        txHash: tx.hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null
      });
      setAdminState("success");
      setAdminMessage("成绩已成功上链，当前交易由 MetaMask 钱包签名");
      setAdminForm({
        studentId: "",
        studentName: "",
        score: "",
        remark: ""
      });
      await refreshHealth();
      await refreshAdmin();
    } catch (error) {
      setAdminState("error");
      setAdminMessage(error.shortMessage || error.reason || error.message || "交易提交失败");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <main className="elegant-page">
      <section className="hero section" data-reveal>
        <div className="hero__backdrop" aria-hidden="true" />

        <div className="hero__copy">
          <h1>链上学生成绩管理系统</h1>
          <p className="hero__lead">查询成绩，管理员录入，结果上链。</p>



          <div className="hero__actions">
            <button type="button" className="button button--primary" onClick={focusQuery}>
              查询成绩
            </button>
            <button type="button" className="button button--secondary" onClick={focusAdmin}>
              {isWalletConnected ? "进入管理员模块" : "连接 MetaMask"}
            </button>
          </div>

          <div className="hero__chips" aria-label="系统状态摘要">
            <span className="chip">{health ? (health.ready ? "本地链已连接" : "链路未就绪") : "加载中"}</span>
            <span className="chip">Chain ID {health?.chainId ?? "—"}</span>
            <span className="chip">任意用户可查询</span>
            <span className="chip">管理员 {shortAddress(adminAddress || health?.adminAddress)}</span>
          </div>
        </div>

        <aside className="hero-panel" data-reveal>
          <div className="hero-panel__visual">
            <img src="/illustrations/blockchain-hero.svg" alt="链上成绩系统插画" />
          </div>

          <div className="hero-panel__body">
            <div className="hero-panel__row">
              <span>当前钱包</span>
              <strong>{walletAddress ? shortAddress(walletAddress) : "未连接"}</strong>
            </div>
            <div className="hero-panel__row">
              <span>当前角色</span>
              <strong>{isAdminWallet ? "管理员" : "普通用户"}</strong>
            </div>
            <div className="hero-panel__row">
              <span>钱包网络</span>
              <strong>{currentWalletChainId ?? "未连接"}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="section section--soft" ref={querySectionRef} id="query">
        <div className="section-inner section-inner--narrow">
          <SectionHeading
            eyebrow="公开查询"
            title="按学号查询链上成绩"
            description=""
            align="center"
          />

          <form className="apple-card query-card" onSubmit={handleQuerySubmit} data-reveal>
            <div className="form-row form-row--compact">
              <label className="input-group">
                <span>学号</span>
                <input
                  ref={queryInputRef}
                  type="text"
                  value={queryStudentId}
                  onChange={(event) => setQueryStudentId(event.target.value)}
                  placeholder="例如 20230001"
                />
              </label>

              <button type="submit" className="button button--primary button--block" disabled={queryLoading}>
                {queryLoading ? "查询中..." : "立即查询"}
              </button>
            </div>

            <p className="module-hint">
              任意用户可查询。
            </p>

            <div className="result-panel">
              <div className="result-panel__head">
                <span>查询结果</span>
                <StatusBadge tone={queryState === "error" ? "danger" : queryState === "success" ? "success" : queryState === "loading" ? "warning" : "neutral"}>
                  {queryStatusLabel}
                </StatusBadge>
              </div>

              {queryResult?.exists ? (
                <div className="result-grid">
                  <div className="result-item">
                    <span>学生学号</span>
                    <strong>{queryResult.studentId}</strong>
                  </div>
                  <div className="result-item">
                    <span>学生姓名</span>
                    <strong>{queryResult.studentName}</strong>
                  </div>
                  <div className="result-item">
                    <span>成绩</span>
                    <strong>{queryResult.score}</strong>
                  </div>
                  <div className="result-item">
                    <span>更新时间</span>
                    <strong>{formatTime(queryResult.updatedAt)}</strong>
                  </div>
                  <div className="result-item">
                    <span>备注信息</span>
                    <strong>{queryResult.remark || "—"}</strong>
                  </div>
                  <div className="result-item">
                    <span>更新人</span>
                    <strong className="mono">{shortAddress(queryResult.updatedBy)}</strong>
                  </div>
                  <div className="result-item result-item--full">
                    <span>交易 Hash</span>
                    <strong className="mono">{queryResult.txHash || "—"}</strong>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>{queryState === "empty" ? "未查询到成绩记录" : "等待输入学号"}</strong>
                  <p>
                    {queryState === "empty"
                      ? "该学号暂无成绩记录。"
                      : queryState === "error"
                        ? queryMessage
                        : "查询结果将显示在这里。"}
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="section" ref={adminSectionRef} id="admin">
        <div className="section-inner section-inner--narrow">
          <SectionHeading
            eyebrow="管理员录入"
            title="仅管理员钱包可提交成绩"
            description=""
            align="center"
          />

          <form className="apple-card admin-card" onSubmit={handleAdminSubmit} data-reveal>
            <div className="wallet-panel">
              <div className="wallet-panel__item">
                <span>当前钱包</span>
                <strong>{walletAddress ? walletAddress : "未连接 MetaMask"}</strong>
              </div>
              <div className="wallet-panel__item">
                <span>管理员地址</span>
                <strong>{adminAddress || "等待后端返回"}</strong>
              </div>
              <div className="wallet-panel__item">
                <span>当前角色</span>
                <strong>{isAdminWallet ? "管理员" : "普通用户"}</strong>
              </div>
              <div className="wallet-panel__item">
                <span>网络校验</span>
                <strong>
                  {currentWalletChainId ?? "未连接"} / 目标链 {expectedChainId ?? "—"}
                </strong>
              </div>
            </div>

            <div className="form-grid">
              <label className="input-group">
                <span>学号</span>
                <input
                  ref={adminStudentIdRef}
                  type="text"
                  value={adminForm.studentId}
                  onChange={(event) => setAdminForm((current) => ({ ...current, studentId: event.target.value }))}
                  placeholder="请输入学号"
                />
              </label>

              <label className="input-group">
                <span>学生姓名</span>
                <input
                  type="text"
                  value={adminForm.studentName}
                  onChange={(event) => setAdminForm((current) => ({ ...current, studentName: event.target.value }))}
                  placeholder="请输入姓名"
                />
              </label>

              <label className="input-group">
                <span>成绩</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={adminForm.score}
                  onChange={(event) => setAdminForm((current) => ({ ...current, score: event.target.value }))}
                  placeholder="0 - 100"
                />
              </label>

              <label className="input-group input-group--full">
                <span>备注信息</span>
                <input
                  type="text"
                  value={adminForm.remark}
                  onChange={(event) => setAdminForm((current) => ({ ...current, remark: event.target.value }))}
                  placeholder="例如：期末考试 / 补考 / 重修成绩"
                />
              </label>

              <div className="input-group input-group--action">
                <span>提交</span>
                <button type="submit" className="button button--primary button--block" disabled={!adminIsReady}>
                  {adminLoading ? "正在上链..." : "提交上链"}
                </button>
              </div>
            </div>

            <p className="module-hint">
              只有管理员钱包可以录入或修改成绩。
            </p>

            {!hasMetaMask ? (
              <div className="inline-tip">
                <strong>未检测到 MetaMask。</strong>
                <span>请先安装并连接钱包。</span>
              </div>
            ) : null}

            {hasMetaMask && !isExpectedChain ? (
              <div className="inline-tip">
                <strong>当前钱包网络不是本地链。</strong>
                <span>请切换到 Ganache 本地网络。</span>
              </div>
            ) : null}

            <div className="result-panel result-panel--admin">
              <div className="result-panel__head">
                <span>提交结果</span>
                <StatusBadge tone={adminState === "error" ? "danger" : adminState === "success" ? "success" : adminState === "loading" ? "warning" : "neutral"}>
                  {adminStatusLabel}
                </StatusBadge>
              </div>

              {adminResult ? (
                <div className="result-grid">
                  <div className="result-item">
                    <span>交易状态</span>
                    <strong>{adminResult.status === 1 ? "成功" : "失败"}</strong>
                  </div>
                  <div className="result-item">
                    <span>区块号</span>
                    <strong>{adminResult.blockNumber ?? "—"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Gas Used</span>
                    <strong>{adminResult.gasUsed ?? "—"}</strong>
                  </div>
                  <div className="result-item result-item--full">
                    <span>交易 Hash</span>
                    <strong className="mono">{adminResult.txHash || "—"}</strong>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>{adminState === "error" ? "提交失败" : "等待管理员提交"}</strong>
                  <p>{adminMessage}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="section-inner footer__inner">
          <span>以太链分布式应用开发</span>
          <span>2026</span>
        </div>
      </footer>
    </main>
  );
}
