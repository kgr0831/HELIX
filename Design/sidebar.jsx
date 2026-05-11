// Sidebar component
const Sidebar = ({ activeId, onSelect }) => (
  <aside className="sidebar">
    <button className="sb-newchat">
      <span className="plus"><Icon.Plus /></span>
      <span>새 토론 시작</span>
      <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-faint)" }}>⌘N</span>
    </button>

    <div className="sb-section">
      <div className="sb-label"><span>Today</span><span className="count mono">3</span></div>
      {CONVERSATIONS.slice(0, 3).map(c => (
        <button key={c.id} className={`sb-item ${c.id === activeId ? "active" : ""}`} onClick={() => onSelect(c.id)}>
          <span className="agent-dots">
            {c.agents.slice(0, 3).map((aid, i) => <span key={i} className="agent-dot" style={{ background: AGENTS[aid].fg }} />)}
          </span>
          <span className="title-text">{c.title}</span>
          <span className="meta">{c.time}</span>
        </button>
      ))}
    </div>

    <div className="sb-section">
      <div className="sb-label"><span>Earlier</span><span className="count mono">{CONVERSATIONS.length - 3}</span></div>
      {CONVERSATIONS.slice(3).map(c => (
        <button key={c.id} className={`sb-item ${c.id === activeId ? "active" : ""}`} onClick={() => onSelect(c.id)}>
          <span className="agent-dots">
            {c.agents.slice(0, 3).map((aid, i) => <span key={i} className="agent-dot" style={{ background: AGENTS[aid].fg }} />)}
          </span>
          <span className="title-text">{c.title}</span>
          <span className="meta">{c.time}</span>
        </button>
      ))}
    </div>

    <div className="sb-foot">
      <span className="avatar">YK</span>
      <span>박연우</span>
      <span className="mono" style={{ marginLeft: "auto", color: "var(--fg-faint)", fontSize: 10 }}>PRO</span>
    </div>
  </aside>
);

Object.assign(window, { Sidebar });
