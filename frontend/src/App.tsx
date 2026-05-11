// App.tsx - HELIX 애플리케이션 루트 컴포넌트
// 그리드 레이아웃: Topbar + Sidebar + Main(Thread + Composer)
// 다크 테마 기반 Linear/Vercel 스타일 UI 구현

import { useState } from "react";
import { HelixWordmark } from "./components/Logo";
import { Sidebar } from "./components/Sidebar";
import { Thread, Composer } from "./components/Chat";
import { SidebarIcon, Search, Plus, Chevron } from "./components/Icons";
import { useSSE } from "./hooks/useSSE";
import { useStore } from "./store/useStore";

export default function App() {
  const [activeId, setActiveId] = useState("c1");
  const { sidebarCollapsed, toggleSidebar, setQuestion, isLoading, resetThread } = useStore();
  const { startQuery } = useSSE();

  const handleSend = (question: string) => {
    setQuestion(question);
    startQuery(question);
  };

  const handleNewChat = () => {
    resetThread();
    setQuestion("");
    setActiveId("new");
  };

  return (
    <div className="app" data-theme="dark" data-sidebar={sidebarCollapsed ? "collapsed" : "open"}>
      <header className="topbar">
        <div className="brand">
          <HelixWordmark size={20} />
        </div>
        <button className="tb-btn" onClick={toggleSidebar} title="사이드바 토글"><SidebarIcon /></button>
        <button className="tb-btn"><Search /> 검색 <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>⌘K</span></button>

        <span className="tb-grow" />

        <span className="tb-pill">
          <span className="dot" />
          <span>Lead</span>
          <strong>GPT-5.4-mini</strong>
          <Chevron />
        </span>
        <span className="tb-pill">
          <span>Mode</span>
          <strong>Debate · 3 rounds</strong>
          <Chevron />
        </span>
        <button className="tb-btn primary" onClick={handleNewChat}><Plus />새 토론</button>
      </header>

      <Sidebar activeId={activeId} onSelect={setActiveId} onNewChat={handleNewChat} />

      <main className="main">
        <Thread />
        <Composer onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
