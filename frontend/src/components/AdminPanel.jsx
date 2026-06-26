import { useMemo, useState } from "react";

// 管理员录入组件：提供给模块化版本使用
function shortHash(hash) {
  if (!hash) {
    return "-";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function AdminPanel({ loading, message, txResult, onSubmit }) {
  // 表单状态保存管理员输入的学号、姓名、成绩和备注。
  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    score: "",
    remark: ""
  });

  const canSubmit = useMemo(() => {
    // 必填项完整且没有正在提交交易时，才允许再次提交。
    return (
      form.studentId.trim().length > 0 &&
      form.studentName.trim().length > 0 &&
      form.score !== "" &&
      !loading
    );
  }, [form, loading]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      // 将表单数据交给父组件处理，父组件负责调用后端上链接口。
      await onSubmit({
        studentId: form.studentId.trim(),
        studentName: form.studentName.trim(),
        score: form.score,
        remark: form.remark.trim()
      });

      setForm({
        studentId: "",
        studentName: "",
        score: "",
        remark: ""
      });
    } catch (error) {
      // 状态提示由父组件统一展示，表单保留便于修改后重试。
    }
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">管理员模块</p>
          <h2>录入或修改成绩</h2>
        </div>
        <span className="pill pill--amber">仅管理员可用</span>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>学号</span>
          <input
            type="text"
            value={form.studentId}
            onChange={(event) => updateField("studentId", event.target.value)}
            placeholder="例如 20230001"
          />
        </label>

        <label className="field">
          <span>学生姓名</span>
          <input
            type="text"
            value={form.studentName}
            onChange={(event) => updateField("studentName", event.target.value)}
            placeholder="例如 张三"
          />
        </label>

        <label className="field">
          <span>成绩</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.score}
            onChange={(event) => updateField("score", event.target.value)}
            placeholder="0 - 100"
          />
        </label>

        <label className="field full">
          <span>备注</span>
          <textarea
            rows="3"
            value={form.remark}
            onChange={(event) => updateField("remark", event.target.value)}
            placeholder="例如：期末成绩 / 补考后更新"
          />
        </label>

        <div className="actions-row full">
          <button type="submit" disabled={!canSubmit}>
            {loading ? "正在上链..." : "提交上链"}
          </button>
          <span className="helper-text">写入操作会由后端用管理员签名发起交易。</span>
        </div>
      </form>

      <div className="result-card">
        <div className="result-card__header">
          <strong>操作状态</strong>
          <span>{loading ? "交易处理中" : "待提交"}</span>
        </div>
        <p className="result-card__message">{message || "提交后这里会显示交易结果和哈希"}</p>

        {txResult ? (
          <div className="tx-box">
            <div>
              <span className="result-label">交易哈希</span>
              <div className="mono">{txResult.txHash}</div>
              <div className="result-muted">{shortHash(txResult.txHash)}</div>
            </div>
            <div className="tx-grid">
              <div>
                <span className="result-label">区块号</span>
                <div className="result-value">{txResult.blockNumber ?? "-"}</div>
              </div>
              <div>
                <span className="result-label">状态</span>
                <div className="result-value">{txResult.status === 1 ? "成功" : "失败"}</div>
              </div>
              <div>
                <span className="result-label">Gas</span>
                <div className="result-value">{txResult.gasUsed ?? "-"}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
