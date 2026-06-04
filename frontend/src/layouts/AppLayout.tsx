import { useEffect } from "react";
import { HelixWordmark } from "../components/Logo";
import { Sidebar } from "../components/Sidebar";
import { Thread, Composer } from "../components/Chat";
import { SidebarIcon, Search, Plus, Chevron } from "../components/Icons";
import { useSSE } from "../hooks/useSSE";
import { useStore } from "../store/useStore";

export function AppLayout() {
  const { sidebarCollapsed, toggleSidebar, setQuestion, isLoading, resetThread,
          activeConversationId, setActiveConversationId, setConversations, restoreConversation } = useStore(); // 전역 상태 라이브러리(Zustand) 써서 상태 관리함. Props drilling 안해도 돼서 좋음
  const { startQuery } = useSSE();

  const loadConversations = () =>
    fetch("/api/conversations", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setConversations)
      .catch(() => {});

  // 마운트 시 대화 목록 로드 (Phase 3)
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대화 이름 변경 / 삭제 (Phase B)
  const handleRename = async (id: string, currentTitle: string) => {
    const title = window.prompt("새 제목", currentTitle);
    if (title === null || !title.trim()) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    loadConversations();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 대화를 삭제할까요? 되돌릴 수 없습니다.")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
    if (activeConversationId === id) {
      resetThread();
      setQuestion("");
      setActiveConversationId(null);
    }
    loadConversations();
  };

  const handleSend = (question: string) => { // 메인 전송 함수. 질문 설정하고 SSE 연결 시작함
    setQuestion(question);
    startQuery(question);
  };

  // 사이드바에서 대화 선택 → 상세 조회 후 스레드 복원
  const handleSelect = (id: string) => {
    fetch(`/api/conversations/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((detail) => { if (detail) restoreConversation(detail); })
      .catch(() => {});
  };

  const handleNewChat = () => {
    resetThread();
    setQuestion("");
    setActiveConversationId(null); // 다음 질문은 새 대화로 생성됨
  };

  return (
    <div className="app" data-theme="dark" data-sidebar={sidebarCollapsed ? "collapsed" : "open"}> {/* 기본 테마는 다크모드! 요즘은 이게 트렌드지 */}
      <header className="topbar">
        <div className="brand">
          <HelixWordmark size={20} />
        </div>
        <button className="tb-btn" onClick={toggleSidebar} title="사이드바 토글"><SidebarIcon /></button>
        <button className="tb-btn"><Search /> 검색 <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>⌘K</span></button> {/* 검색 기능은 아직 구현 전... 70%니까 봐주세요 */}

        <span className="tb-grow" />

        <span className="tb-pill">
          <span className="dot" />
          <span>Lead</span>
          <strong>GPT-5.4-mini</strong>
          <Chevron />
        </span>
        <span className="tb-pill">
          <span>Mode</span>
          <strong>Debate · 4 rounds</strong>
          <Chevron />
        </span>
        <button className="tb-btn primary" onClick={handleNewChat}><Plus />새 토론</button>
      </header>

      <Sidebar activeId={activeConversationId} onSelect={handleSelect} onNewChat={handleNewChat} onRename={handleRename} onDelete={handleDelete} />

      <main className="main">
        <Thread />
        <Composer onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  );
}
