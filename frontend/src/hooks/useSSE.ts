// useSSE.ts - Server-Sent Events 연결 훅
// 백엔드의 SSE 스트림을 수신하여 실시간으로 토론 이벤트를 처리
// fetch + ReadableStream 방식으로 POST 요청 후 SSE 이벤트 순차 파싱

import { useCallback, useRef } from "react";
import { useStore } from "../store/useStore";

export function useSSE() {
  const { setLoading, addEvent, addConsensusRound, setFinalAnswer, setError, setStatusMessage, setElapsedMs, resetThread, setActiveConversationId, setConversations } = useStore();
  const abortRef = useRef<AbortController | null>(null); // AbortController 써서 이전 요청 취소할 수 있게 함. 연타 방지!

  const startQuery = useCallback(
    async (question: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      resetThread();
      setLoading(true);
      const startTime = Date.now(); // 총 소요 시간 계산하려고 시작 시간 기록해둠

      try {
        // 진행 중인 대화가 있으면 이어쓰기, 없으면 백엔드가 새 대화를 생성 (Phase 3)
        const conversationId = useStore.getState().activeConversationId;
        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, conversation_id: conversationId }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          setError("서버 연결에 실패했습니다");
          setLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = ""; // 청크 단위로 들어오는 데이터를 합쳐둘 버퍼. SSE는 이게 좀 귀찮음

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // \r\n → \n 정규화 (sse-starlette는 \r\n을 사용)
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

          // SSE 이벤트는 빈 줄(\n\n)로 구분
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;

            let eventType = "";
            let dataStr = "";
            for (const line of block.split("\n")) {
              const trimmed = line.trim();
              if (trimmed.startsWith("event:")) {
                eventType = trimmed.slice(6).trim();
              } else if (trimmed.startsWith("data:")) {
                dataStr = trimmed.slice(5).trim();
              }
            }

            if (!eventType || !dataStr) continue; // 가끔 빈 이벤트 들어오는 거 걸러내야 함

            try {
              const data = JSON.parse(dataStr);

              if (eventType === "status") {
                setStatusMessage(data.message || "");
              } else if (eventType === "conversation") {
                setActiveConversationId(data.conversation_id); // 새/기존 대화 id 추적
              } else if (eventType === "agent_response") {
                addEvent({
                  ...data,
                  latency_ms: data.latency_ms ?? (Date.now() - startTime),
                });
              } else if (eventType === "consensus_check") {
                addConsensusRound(data.round);
                addEvent({
                  id: `consensus-${data.round}`,
                  agent_name: "Leader",
                  role: "leader",
                  phase: "consensus_check",
                  content: data.content,
                  consensus: data.consensus,
                });
              } else if (eventType === "final_answer") {
                setElapsedMs(Date.now() - startTime);
                setFinalAnswer(data); // 최종 답변까지 오면 스트림 끝! 고생했다 봇들아
              } else if (eventType === "error") {
                setError(data.message || "백엔드 오류가 발생했습니다");
              }
            } catch {
              // JSON 파싱 실패 시 무시
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      } finally {
        setElapsedMs(Date.now() - startTime);
        setLoading(false);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        // 토론 종료 후 사이드바 목록 갱신 (새 대화 제목 반영)
        try {
          const r = await fetch("/api/conversations", { credentials: "include" });
          if (r.ok) setConversations(await r.json());
        } catch {
          /* 목록 갱신 실패는 무시 */
        }
      }
    },
    [resetThread, setLoading, addEvent, addConsensusRound, setFinalAnswer, setError, setStatusMessage, setElapsedMs, setActiveConversationId, setConversations]
  );

  return { startQuery };
}
