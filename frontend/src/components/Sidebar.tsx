// Sidebar.tsx - 대화 이력 사이드바
// 오늘/이전 섹션으로 그룹화된 대화 목록
// 에이전트 색상 도트와 시간 메타 정보 표시

import { Plus } from "./Icons";
import { AGENTS } from "./agents";

interface Conversation {
  id: string;
  title: string;
  agents: string[];
  time: string;
}

// 사이드바에 표시할 대화 샘플 데이터
const CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "C# SqlConnection 예외 처리", agents: ["gpt","flash","sonar"], time: "방금" },
  { id: "c2", title: "Postgres vs DynamoDB 트레이드오프", agents: ["gpt","flash","grok"], time: "12분" },
  { id: "c3", title: "RAG 파이프라인 임베딩 모델 선택", agents: ["gpt","sonar","flash"], time: "1시간" },
  { id: "c4", title: "K8s 무중단 배포 — 카나리 vs 블루그린", agents: ["gpt","flash","sonar","grok"], time: "어제" },
  { id: "c5", title: "Rust async 런타임 비교 (tokio/smol)", agents: ["sonar","grok","gpt"], time: "어제" },
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export const Sidebar = ({ activeId, onSelect, onNewChat }: SidebarProps) => (
  <aside className="sidebar">
    <button className="sb-newchat" onClick={onNewChat}>
      <span className="plus"><Plus /></span>
      <span>새 토론 시작</span>
      <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-faint)" }}>⌘N</span>
    </button>

    <div className="sb-section">
      <div className="sb-label"><span>Today</span><span className="count mono">{Math.min(3, CONVERSATIONS.length)}</span></div>
      {CONVERSATIONS.slice(0, 3).map(c => (
        <button key={c.id} className={`sb-item ${c.id === activeId ? "active" : ""}`} onClick={() => onSelect(c.id)}>
          <span className="agent-dots">
            {c.agents.slice(0, 3).map((aid, i) => {
              const a = AGENTS[aid];
              return <span key={i} className="agent-dot" style={{ background: a?.fg ?? "var(--fg-faint)" }} />;
            })}
          </span>
          <span className="title-text">{c.title}</span>
          <span className="meta">{c.time}</span>
        </button>
      ))}
    </div>

    {CONVERSATIONS.length > 3 && (
      <div className="sb-section">
        <div className="sb-label"><span>Earlier</span><span className="count mono">{CONVERSATIONS.length - 3}</span></div>
        {CONVERSATIONS.slice(3).map(c => (
          <button key={c.id} className={`sb-item ${c.id === activeId ? "active" : ""}`} onClick={() => onSelect(c.id)}>
            <span className="agent-dots">
              {c.agents.slice(0, 3).map((aid, i) => {
                const a = AGENTS[aid];
                return <span key={i} className="agent-dot" style={{ background: a?.fg ?? "var(--fg-faint)" }} />;
              })}
            </span>
            <span className="title-text">{c.title}</span>
            <span className="meta">{c.time}</span>
          </button>
        ))}
      </div>
    )}

    <div className="sb-foot">
      <span className="avatar">KG</span>
      <span>김가람</span>
      <span className="mono" style={{ marginLeft: "auto", color: "var(--fg-faint)", fontSize: 10 }}>PRO</span>
    </div>
  </aside>
);
