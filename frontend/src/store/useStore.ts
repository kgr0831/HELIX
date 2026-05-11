// useStore.ts - Zustand 전역 상태 관리
// 4-Agent 토론의 실시간 이벤트와 UI 상태를 중앙에서 관리
// SSE 이벤트 수신 → 상태 업데이트 → 컴포넌트 리렌더링

import { create } from "zustand";
import type { AgentEvent, FinalAnswerEvent } from "../types";

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
}

export const useStore = create<AppState>((set) => ({
  question: "",
  isLoading: false,
  events: [],
  consensusRounds: [],
  finalAnswer: null,
  error: null,
  statusMessage: "",
  sidebarCollapsed: false,
  elapsedMs: 0,

  setQuestion: (q) => set({ question: q }),
  setLoading: (v) => set({ isLoading: v }),
  addEvent: (e) => set((s) => ({ events: [...s.events, e] })),
  addConsensusRound: (round) => set((s) => ({ consensusRounds: [...s.consensusRounds, round] })),
  setFinalAnswer: (a) => set({ finalAnswer: a }),
  setError: (e) => set({ error: e }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setElapsedMs: (ms) => set({ elapsedMs: ms }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  resetThread: () => set({ events: [], consensusRounds: [], finalAnswer: null, error: null, elapsedMs: 0, statusMessage: "" }),
}));
