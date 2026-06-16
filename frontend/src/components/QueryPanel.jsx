import { useMemo, useState } from "react";

// 查询组件：保留给模块化版本使用，当前新版首页已将该逻辑整合到 Home.jsx。
function formatDate(timestamp) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp * 1000).toLocaleString("zh-CN");
}

function shortAddress(address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function QueryPanel({ loading, message, result, onQuery }) {
  // 查询模块只需要维护学号输入，其余结果状态由父组件传入。
  const [studentId, setStudentId] = useState("");
  const canSubmit = useMemo(() => studentId.trim().length > 0 && !loading, [studentId, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    // 查询操作是只读调用，不会触发链上交易。
    await onQuery(studentId.trim());
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">查询模块</p>
          <h2>按学号查询成绩</h2>
        </div>
        <span className="pill pill--blue">所有用户可用</span>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>学号</span>
          <input
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="例如 20230001"
          />
        </label>

        <div className="actions-row">
          <button type="submit" disabled={!canSubmit}>
            {loading ? "查询中..." : "查询成绩"}
          </button>
          <span className="helper-text">查询结果直接来自链上，只读调用不会发交易。</span>
        </div>
      </form>

      <div className="result-card">
        <div className="result-card__header">
          <strong>查询状态</strong>
          <span>{loading ? "正在加载" : "已就绪"}</span>
        </div>
        <p className="result-card__message">{message || "请输入学号后点击查询"}</p>

        {result ? (
          result.exists ? (
            <div className="result-grid">
              <div>
                <span className="result-label">学号</span>
                <div className="result-value">{result.studentId}</div>
              </div>
              <div>
                <span className="result-label">姓名</span>
                <div className="result-value">{result.studentName}</div>
              </div>
              <div>
                <span className="result-label">成绩</span>
                <div className="result-value result-value--accent">{result.score}</div>
              </div>
              <div>
                <span className="result-label">更新时间</span>
                <div className="result-value">{formatDate(result.updatedAt)}</div>
              </div>
              <div className="result-span">
                <span className="result-label">备注</span>
                <div className="result-value">{result.remark || "无"}</div>
              </div>
              <div className="result-span">
                <span className="result-label">最后修改人</span>
                <div className="result-value">{shortAddress(result.updatedBy)}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>未找到成绩记录</strong>
              <p>该学号目前没有上链成绩，系统已返回合法提示，不会报错。</p>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
