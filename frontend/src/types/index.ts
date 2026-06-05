// index.ts - 프론트엔드 타입 정의
// SSE 이벤트 타입과 Agent 응답 데이터 구조를 정의
// 백엔드 sse.py의 이벤트 포맷과 1:1 대응

export interface AgentEvent {
  id: string;
  agent_name: string;
  role: string;
  phase: string;
  content: string;
  round_number?: number;
  token_count?: number;
  latency_ms?: number;
  consensus?: boolean;
}

export interface ConsensusEvent {
  consensus: boolean;
  round: number;
  content: string;
}

export interface FinalAnswerEvent {
  answer: string;
  consensus: boolean;
  token_usage: Record<string, number>;
  cached?: boolean;  // 캐시에서 즉시 반환된 답변인지
}

export interface StatusEvent {
  message: string;
}

// --- 대화 영구화 (Phase 3) ---
export interface ConversationMeta {
  id: string;
  title: string;
  created_at: string;
}

export interface StoredAgentEvent {
  round_number: number;
  agent_name: string;
  role: string;
  content: string;
}

export interface StoredMessage {
  id: string;
  question: string;
  final_answer: string | null;
  consensus: boolean;
  token_usage: Record<string, number> | null;
  events: StoredAgentEvent[];
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: StoredMessage[];
}
