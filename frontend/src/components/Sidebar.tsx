// Sidebar.tsx - 대화 이력 사이드바 (Phase 3: DB 연동)
// 오늘/이전 섹션으로 그룹화된 실제 대화 목록 (useStore.conversations)

import { useState } from "react";
import { Plus } from "./Icons";
import { AGENTS } from "./agents";
import { useStore } from "../store/useStore";
import { useAuth } from "../store/useAuth";
import type { ConversationMeta } from "../types";

// HELIX는 항상 4개 이기종 에이전트로 토론하므로 도트는 고정 표시
const AGENT_DOTS = ["gpt", "flash", "sonar", "grok"];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간`;
  const day = Math.floor(hr / 24);
  return day === 1 ? "어제" : `${day}일`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

interface SidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}

const ConvItem = ({ c, activeId, onSelect, onRename, onDelete }: {
  c: ConversationMeta; activeId: string | null;
  onSelect: (id: string) => void; onRename: (id: string, t: string) => void; onDelete: (id: string) => void;
}) => (
  <div className="sb-item-row">
    <button className={`sb-item ${c.id === activeId ? "active" : ""}`} onClick={() => onSelect(c.id)}>
      <span className="agent-dots">
        {AGENT_DOTS.slice(0, 3).map((aid, i) => {
          const a = AGENTS[aid];
          return <span key={i} className="agent-dot" style={{ background: a?.fg ?? "var(--fg-faint)" }} />;
        })}
      </span>
      <span className="title-text">{c.title}</span>
      <span className="meta">{relativeTime(c.created_at)}</span>
    </button>
    <span className="sb-item-actions">
      <button className="sb-item-act" title="이름 변경" onClick={() => onRename(c.id, c.title)}>✎</button>
      <button className="sb-item-act danger" title="삭제" onClick={() => onDelete(c.id)}>🗑</button>
    </span>
  </div>
);

export const Sidebar = ({ activeId, onSelect, onNewChat, onRename, onDelete }: SidebarProps) => {
  const conversations = useStore((s) => s.conversations);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : conversations;
  const today = filtered.filter((c) => isToday(c.created_at));
  const earlier = filtered.filter((c) => !isToday(c.created_at));

  const initials = (user?.name ?? user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <button className="sb-newchat" onClick={onNewChat}>
        <span className="plus"><Plus /></span>
        <span>새 토론 시작</span>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-faint)" }}>⌘N</span>
      </button>

      <div className="sb-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="대화 검색…"
        />
      </div>

      {today.length > 0 && (
        <div className="sb-section">
          <div className="sb-label"><span>Today</span><span className="count mono">{today.length}</span></div>
          {today.map((c) => <ConvItem key={c.id} c={c} activeId={activeId} onSelect={onSelect} onRename={onRename} onDelete={onDelete} />)}
        </div>
      )}

      {earlier.length > 0 && (
        <div className="sb-section">
          <div className="sb-label"><span>Earlier</span><span className="count mono">{earlier.length}</span></div>
          {earlier.map((c) => <ConvItem key={c.id} c={c} activeId={activeId} onSelect={onSelect} onRename={onRename} onDelete={onDelete} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="sb-section">
          <div className="sb-label"><span>{query.trim() ? "검색 결과 없음" : "대화 없음"}</span></div>
        </div>
      )}

      <div className="sb-foot">
        {user?.picture ? (
          <img className="avatar-img" src={user.picture} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar">{initials}</span>
        )}
        <span className="sb-foot-name" title={user?.email ?? undefined}>{user?.name ?? user?.email ?? "사용자"}</span>
        <button className="sb-logout" onClick={logout} title="로그아웃">로그아웃</button>
      </div>
    </aside>
  );
};
