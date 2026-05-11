// Chat.tsx - 토론 스레드 핵심 컴포넌트
// Thread: 사용자 메시지 → GlassBox → 최종 답변 구성
// GlassBox: 라운드별 에이전트 사고 과정 실시간 시각화
// StreamingText: 글자가 실시간 타이핑되는 thinking 효과

import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Atom, Check, Chevron, Copy, Up, Down, Send, Attach, Alert } from "./Icons";
import { HelixMark } from "./Logo";
import { AGENTS, resolveAgentId } from "./agents";
import type { AgentInfo } from "./agents";
import { useStore } from "../store/useStore";
import type { AgentEvent } from "../types";

// ── 시간 포매팅 ──
function formatTime(ms: number): string {
  const sec = ms / 1000;
  const min = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${String(min).padStart(2, "0")}:${s}`;
}

// ── StreamingText: 글자가 하나씩 나타나는 타이핑 효과 ──
function StreamingText({ text, speed = 12, className = "thinking-text", onComplete }: { text: string; speed?: number; className?: string; onComplete?: () => void }) {
  const [charCount, setCharCount] = useState(0);
  const textRef = useRef(text);
  const completedRef = useRef(false);

  useEffect(() => {
    textRef.current = text;
    setCharCount(0);
    completedRef.current = false;
  }, [text]);

  useEffect(() => {
    if (charCount >= textRef.current.length) {
      if (!completedRef.current && onComplete) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    const step = Math.max(2, Math.floor(textRef.current.length / 50));
    const id = setTimeout(() => setCharCount(c => Math.min(textRef.current.length, c + step)), speed);
    return () => clearTimeout(id);
  }, [charCount, speed, onComplete]);

  const visible = text.slice(0, charCount);
  const isDone = charCount >= text.length;

  return (
    <div className={className}>
      <Markdown>{visible}</Markdown>
      {!isDone && <span className="thinking-caret" />}
    </div>
  );
}

// ── AgentAvatar ──
function AgentAvatar({ id, size = 22 }: { id: string; size?: number }) {
  const a = AGENTS[id];
  if (!a) return null;
  return (
    <span className="turn-avatar" style={{ background: a.bg, color: a.fg, width: size, height: size, fontSize: size * 0.46 }}>
      {a.glyph}
    </span>
  );
}

const ROLE_MAP: Record<string, string> = {
  gpt: "리더",
  flash: "사실 검증",
  sonar: "논리 검증",
  grok: "비판 검증",
};

// ── Turn 데이터 ──
interface TurnData {
  id: string;
  agentId: string;
  role: string;
  phase: string;
  content: string;
  latencyMs?: number;
}

// ── Turn: 개별 에이전트 사고 과정 ──
function Turn({ turn, onComplete }: { turn: TurnData; onComplete?: () => void }) {
  const a: AgentInfo | undefined = AGENTS[turn.agentId];
  if (!a) return null;

  const roleName = ROLE_MAP[turn.agentId] || a.name;

  return (
    <div className="turn">
      <div className="turn-rail">
        <AgentAvatar id={turn.agentId} />
      </div>
      <div className="turn-body">
        <div className="turn-head">
          <span className="turn-agent">{roleName}</span>
          <span className="turn-model mono">{a.model}</span>
          {turn.latencyMs != null && (
            <span className="turn-time mono">{formatTime(turn.latencyMs)}</span>
          )}
        </div>
        <div className="turn-text">
          <StreamingText text={turn.content} speed={50} onComplete={onComplete} />
        </div>
      </div>
    </div>
  );
}

// ── PlaceholderTurn: 답변 생성 중인 상태 표시 ──
function PlaceholderTurn({ agentId, label = "답변 생성 중..." }: { agentId: string; label?: string }) {
  const a = AGENTS[agentId];
  if (!a) return null;
  const roleName = ROLE_MAP[agentId] || a.name;

  return (
    <div className="turn placeholder">
      <div className="turn-rail"><AgentAvatar id={agentId} /></div>
      <div className="turn-body">
        <div className="turn-head">
          <span className="turn-agent">{roleName}</span>
          <span className="turn-model mono">{a.model}</span>
          <span className="turn-status">{label}</span>
        </div>
        <div className="turn-text">
          <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>
    </div>
  );
}

// ── StatusIndicator ──
function StatusIndicator({ message }: { message: string }) {
  return (
    <div className="status-indicator">
      <span className="status-pulse" />
      <span>{message}</span>
    </div>
  );
}

const PARALLEL_AGENT_IDS = ["flash", "sonar", "grok"];

// ── 이벤트 → 라운드별 그룹화 ──
function groupByRound(events: AgentEvent[], isLive: boolean): { roundId: number; label: string; turns: TurnData[] }[] {
  const groups: { roundId: number; label: string; turns: TurnData[] }[] = [];
  let currentRound = 0;

  for (const e of events) {
    const turn: TurnData = {
      id: e.id,
      agentId: resolveAgentId(e.agent_name, e.role),
      role: e.role,
      phase: e.phase,
      content: e.content,
      latencyMs: e.latency_ms,
    };

    if (e.phase === "planning") {
      currentRound = e.round_number || (currentRound + 1);
      groups.push({ roundId: currentRound, label: "분석 · 디스패치", turns: [turn] });
    } else if (e.phase === "discussion") {
      let lastGroup = groups[groups.length - 1];
      const eventRound = e.round_number || currentRound;

      // 만약 마지막 그룹이 다른 라운드이거나 다른 라벨이라면 새 그룹 생성
      if (!lastGroup || lastGroup.label !== "병렬 토론" || lastGroup.roundId !== eventRound) {
        currentRound = eventRound;
        groups.push({ roundId: currentRound, label: "병렬 토론", turns: [turn] });
      } else {
        lastGroup.turns.push(turn);
      }
    }
  }

  // 1. 아직 아무 이벤트도 없지만 로딩 중이라면 리더의 분석 단계 미리 표시
  if (isLive && groups.length === 0) {
    groups.push({ roundId: 1, label: "분석 · 디스패치", turns: [] });
  }

  // 2. 리더의 계획이 끝났다면 빈 병렬 토론 그룹을 미리 생성 (플레이스홀더용)
  if (isLive && groups.length > 0) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup.label === "분석 · 디스패치" && lastGroup.turns.length > 0) {
      groups.push({ roundId: currentRound + 1, label: "병렬 토론", turns: [] });
    }
  }

  return groups;
}

// ── GlassBox ──
interface GlassBoxProps {
  events: AgentEvent[];
  isLive: boolean;
  totalTokens: number;
  elapsedMs: number;
  statusMessage: string;
  onAllTurnsComplete: () => void;
}

function GlassBox({ events, isLive, totalTokens, elapsedMs, statusMessage, onAllTurnsComplete }: GlassBoxProps) {
  const [expanded, setExpanded] = useState(true);
  const completedTurnsRef = useRef<Set<string>>(new Set());
  const handleTurnComplete = (id: string) => {
    completedTurnsRef.current.add(id);
    const renderableCount = events.filter(e => e.phase === "planning" || e.phase === "discussion").length;
    if (!isLive && completedTurnsRef.current.size >= renderableCount) {
      onAllTurnsComplete();
    }
  };
  useEffect(() => {
    const renderableCount = events.filter(e => e.phase === "planning" || e.phase === "discussion").length;
    if (!isLive && renderableCount > 0 && completedTurnsRef.current.size >= renderableCount) {
      onAllTurnsComplete();
    }
  }, [isLive, events, onAllTurnsComplete]);

  // 새로운 질문 시에만 초기화 (Thread에서 제어)

  const rounds = groupByRound(events, isLive);
  const hasPlaceholders = rounds.some((r, idx) =>
    (r.label === "분석 · 디스패치" && r.turns.length === 0) ||
    (r.label === "병렬 토론" && idx === rounds.length - 1 && r.turns.length < PARALLEL_AGENT_IDS.length)
  );

  return (
    <div className="glassbox">
      <div className={`gb-head ${expanded ? "expanded" : ""}`} onClick={() => setExpanded(e => !e)}>
        <div className="gb-title"><Atom /> Glass Box</div>
        {isLive ? (
          <span className="gb-status pulse">{statusMessage}</span>
        ) : (
          <span className={`gb-status ${events.some(e => e.phase === "consensus_check" && !e.consensus) ? "fail" : ""}`}>
            {events.some(e => e.phase === "consensus_check" && !e.consensus) ? (
              <><Alert />합의 미달</>
            ) : (
              <><Check />합의 도달</>
            )}
          </span>
        )}
        <div className="gb-stats">
          <span><strong>{events.length}</strong> turns</span>
          {totalTokens > 0 && <span><strong>{totalTokens.toLocaleString()}</strong> tok</span>}
          {elapsedMs > 0 && <span><strong>{(elapsedMs / 1000).toFixed(1)}</strong>s</span>}
        </div>
        <div className="gb-chevron"><Chevron /></div>
      </div>
      <div className="gb-body" style={{ display: expanded ? "flex" : "none" }}>
        {rounds.map((r, index) => (
          <div key={r.roundId} className="gb-round">
            <div className="gb-round-label">
              <span>Round {r.roundId}</span>
              <span style={{ color: "var(--fg-dim)", textTransform: "none", letterSpacing: 0 }}>· {r.label}</span>
            </div>
            {r.turns.map((t, i) => (
              <Turn key={t.id} turn={t} onComplete={() => handleTurnComplete(t.id)} />
            ))}
            {isLive && r.label === "분석 · 디스패치" && r.turns.length === 0 && (
              <PlaceholderTurn agentId="gpt" label="역할 분배 중..." />
            )}
            {isLive && r.label === "병렬 토론" && index === rounds.length - 1 && (
              PARALLEL_AGENT_IDS
                .filter(id => !r.turns.some(t => t.agentId === id))
                .map(id => <PlaceholderTurn key={id} agentId={id} label={r.roundId > 1 ? "재토론 답변 생성 중..." : "답변 생성 중..."} />)
            )}
          </div>
        ))}
        {isLive && statusMessage && !hasPlaceholders && (
          <StatusIndicator message={statusMessage} />
        )}
      </div>
    </div>
  );
}

// ── FinalAnswer ──
function FinalAnswer({ answer, consensus }: { answer: string; consensus: boolean }) {
  const leadAgent = AGENTS["gpt"];
  const agentIds = Object.keys(AGENTS);

  return (
    <div className="final">
      <div className="final-head">
        <span className="lead-avatar" style={{ background: leadAgent.bg, color: leadAgent.fg }}>{leadAgent.glyph}</span>
        <div className="meta">
          <span className="title">합성된 답변</span>
          <span className="sub mono">조율: {leadAgent.name} · {leadAgent.model}</span>
        </div>
        {consensus ? (
          <span className="consensus"><Check />Consensus</span>
        ) : (
          <span className="consensus fail"><Alert />No Consensus (Limit Reached)</span>
        )}
      </div>
      <div className="final-text">
        <StreamingText text={answer} className="" />
      </div>
      <div className="final-foot">
        <div className="agents-used">
          <span>참여 모델</span>
          <span className="stack">
            {agentIds.map(id => {
              const ag = AGENTS[id];
              return <span key={id} style={{ background: ag.bg, color: ag.fg }}>{ag.glyph}</span>;
            })}
          </span>
        </div>
        <div className="actions">
          <button className="icon-btn" title="복사" onClick={() => navigator.clipboard.writeText(answer)}><Copy /></button>
          <button className="icon-btn" title="좋아요"><Up /></button>
          <button className="icon-btn" title="싫어요"><Down /></button>
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ──
function EmptyState() {
  return (
    <div className="thread">
      <div className="thread-inner" style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--fg-faint)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, opacity: 0.5 }}>
            <HelixMark size={48} accent="var(--accent)" muted="var(--fg-faint)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-dim)", margin: "0 0 6px" }}>HELIX에 질문하세요</p>
          <p style={{ fontSize: 13, margin: 0 }}>4개 AI 모델이 토론하고 합성된 답변을 제공합니다</p>
        </div>
      </div>
    </div>
  );
}

// ── Thread ──
export function Thread() {
  const { question, isLoading, events, finalAnswer, error, elapsedMs, statusMessage } = useStore();
  const threadRef = useRef<HTMLDivElement>(null);

  const [allTypingDone, setAllTypingDone] = useState(false);
  const totalTokens = events.reduce((sum, e) => sum + (e.token_count ?? 0), 0);

  useEffect(() => {
    if (isLoading) {
      setAllTypingDone(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [events.length, finalAnswer, allTypingDone]);

  if (!question && events.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="thread" ref={threadRef}>
      <div className="thread-inner">
        {question && (
          <div className="msg-user">
            <div className="you-tag mono">You · 방금</div>
            <div className="msg-user-bubble">{question}</div>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {(events.length > 0 || isLoading) && (
          <GlassBox
            events={events}
            isLive={isLoading}
            totalTokens={totalTokens}
            elapsedMs={elapsedMs}
            statusMessage={statusMessage}
            onAllTurnsComplete={() => setAllTypingDone(true)}
          />
        )}

        {finalAnswer && allTypingDone && (
          <FinalAnswer answer={finalAnswer.answer} consensus={finalAnswer.consensus} />
        )}
      </div>
    </div>
  );
}

// ── Composer ──
interface ComposerProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled }: ComposerProps) {
  const [val, setVal] = useState("");

  const handleSend = () => {
    const trimmed = val.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          placeholder="질문을 입력하세요. HELIX가 4개 모델을 호출해 토론하고 합성합니다…"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="composer-row">
          <span className="composer-chip"><Atom /> 4 agents · GPT-5.4 lead</span>
          <span className="composer-chip"><Attach /> 첨부</span>
          <button className="composer-send" disabled={!val.trim() || disabled} onClick={handleSend}><Send /></button>
        </div>
      </div>
    </div>
  );
}
