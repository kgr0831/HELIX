// useStore.ts - Zustand 전역 상태 관리
// 4-Agent 토론의 실시간 이벤트와 UI 상태를 중앙에서 관리
// SSE 이벤트 수신 → 상태 업데이트 → 컴포넌트 리렌더링

import { create } from "zustand"; // Zustand이 진짜 가볍고 좋은 듯. 리덕스는 너무 무거워..
import type { AgentEvent, FinalAnswerEvent, ConversationMeta, ConversationDetail } from "../types";

interface AppState {
  question: string;
  isLoading: boolean;
  events: AgentEvent[];
  consensusRounds: number[];
  finalAnswer: FinalAnswerEvent | null;
  error: string | null;
  statusMessage: string;
  sidebarCollapsed: boolean;
  elapsedMs: number;
  conversations: ConversationMeta[];      // 사이드바 대화 목록 (Phase 3)
  activeConversationId: string | null;    // 현재 열린 대화 id
  isRestored: boolean;                     // 복원된 대화(타이핑 효과 생략)인지 여부

  setQuestion: (q: string) => void;
  setLoading: (v: boolean) => void;
  addEvent: (e: AgentEvent) => void;
  addConsensusRound: (round: number) => void;
  setFinalAnswer: (a: FinalAnswerEvent) => void;
  setError: (e: string | null) => void;
  setStatusMessage: (msg: string) => void;
  setElapsedMs: (ms: number) => void;
  toggleSidebar: () => void;
  resetThread: () => void;
  setConversations: (c: ConversationMeta[]) => void;
  setActiveConversationId: (id: string | null) => void;
  restoreConversation: (detail: ConversationDetail) => void;  // 대화 클릭 시 스레드 복원
}

export const useStore = create<AppState>((set) => ({ // 스토어 생성! 여기가 우리 앱의 뇌라고 볼 수 있음
  question: "",
  isLoading: false,
  events: [],
  consensusRounds: [],
  finalAnswer: null,
  error: null,
  statusMessage: "",
  sidebarCollapsed: false, // 사이드바 기본은 열려있는 상태
  elapsedMs: 0,
  conversations: [],
  activeConversationId: null,
  isRestored: false,

  setQuestion: (q) => set({ question: q }),
  setLoading: (v) => set({ isLoading: v }),
  addEvent: (e) => set((s) => ({ events: [...s.events, e] })), // 이벤트 올 때마다 배열에 계속 추가함. 불변성 유지 필수
  addConsensusRound: (round) => set((s) => ({ consensusRounds: [...s.consensusRounds, round] })),
  setFinalAnswer: (a) => set({ finalAnswer: a }),
  setError: (e) => set({ error: e }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setElapsedMs: (ms) => set({ elapsedMs: ms }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  resetThread: () => set({ events: [], consensusRounds: [], finalAnswer: null, error: null, elapsedMs: 0, statusMessage: "", isRestored: false }), // 새 질문 던질 때 초기화해줘야 함 (activeConversationId는 유지 — 후속 질문은 같은 대화에 이어짐)
  setConversations: (c) => set({ conversations: c }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  // 대화 상세를 받아 가장 최근 메시지의 토론 과정을 Glass Box 스레드로 복원
  restoreConversation: (detail) => {
    const msgs = detail.messages;
    if (msgs.length === 0) {
      set({ events: [], consensusRounds: [], finalAnswer: null, question: "", activeConversationId: detail.id, error: null, statusMessage: "", isLoading: false, isRestored: true });
      return;
    }
    const last = msgs[msgs.length - 1];
    const events: AgentEvent[] = last.events.map((e, i) => ({
      id: `restored-${detail.id}-${i}`,
      agent_name: e.agent_name,
      role: e.role,
      phase: e.round_number === 0 ? "planning" : "discussion",
      round_number: e.round_number,
      content: e.content,
    }));
    set({
      question: last.question,
      events,
      consensusRounds: [],
      finalAnswer: { answer: last.final_answer ?? "", consensus: last.consensus, token_usage: last.token_usage ?? {} },
      error: null,
      statusMessage: "",
      isLoading: false,
      activeConversationId: detail.id,
      isRestored: true,
    });
  },
}));
