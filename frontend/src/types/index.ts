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
}

export interface StatusEvent {
  message: string;
}
