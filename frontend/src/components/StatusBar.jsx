export default function StatusBar({ tone = "info", title, message, detail }) {
  // 系统状态条：用于显示后端、本地链和部署文件等运行状态。
  return (
    <div className={`status-bar tone-${tone}`}>
      <div className="status-bar__title">{title}</div>
      <div className="status-bar__message">{message}</div>
      {detail ? <div className="status-bar__detail">{detail}</div> : null}
    </div>
  );
}
