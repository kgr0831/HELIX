# HELIX Multi-Agent Debate System - Bug Tracker

## Resolved

### 1. UI Status Discrepancy (Fixed)
- **Issue**: "재토론 답변 생성 중..." appeared during Round 1.
- **Fix**: `groupByRound`의 빈 병렬 토론 그룹 `roundId`를 `currentRound`로 수정.

### 2. Final Answer Rendering Failure (Fixed)
- **Issue**: Glass Box 완료 후에도 Final Answer가 렌더링되지 않음.
- **Fix**: 불안정한 `Set` 기반 애니메이션 추적을 제거하고, SSE 스트림 종료 후 타이머 기반으로 단순화.

### 3. Consensus Label Mismatch (Fixed)
- **Issue**: 합의 미달인데 "합의 도달"로 표시됨.
- **Fix**: 마지막 `consensus_check` 이벤트의 `consensus` 값 기준으로 판정하도록 변경.

### 4. Animation Sync Instability (Fixed)
- **Issue**: typing animation 완료 대기 로직이 불안정하여 Final Answer가 무한 대기.
- **Fix**: `completedTurnsRef` / `onComplete` 콜백 체인을 제거하고 `isLoading` + `finalAnswer` 상태 기반 타이머로 교체.

### 5. LangGraph Concurrent Update Error (Fixed)
- **Issue**: `round_number` 키에 병렬 노드 3개가 동시에 쓰기 시도 → `INVALID_CONCURRENT_GRAPH_UPDATE`.
- **Fix**: `_call_specific_agent`에서 `round_number` 반환을 제거. `round_number`는 `leader_plan_node`와 `leader_synthesize_node`에서만 설정.

### 6. Overly Strict Consensus Criteria (Fixed)
- **Issue**: 역할 분담, 프로세스 비판 등 메타적 비판이 합의 미달을 유발.
- **Fix**: Leader 합성 프롬프트의 합의 기준을 "핵심 사실 모순 여부"로 재정의. Logician/Critic 시스템 프롬프트에 프로세스 비판 금지 명시.

### 7. No Consensus Final Answer (Fixed)
- **Issue**: 합의 미달 시 최종 답변이 쟁점 나열일 뿐, 실질적 답변이 없음.
- **Fix**: `final_answer_node`에서 No Consensus 시 Leader가 토론 내용을 종합한 강제 최종 답변을 LLM으로 생성.

## Other Fixes Applied

- `langchain-openai` 패키지 `requirements.txt` 누락 → 추가
- `AgentEvent` TypeScript 타입에 `consensus` 필드 누락 → 추가
- `max_rounds` 값 불일치 (5/3/10) → 5로 통일 (실질 4회 토론)
- 프론트엔드가 백엔드 `latency_ms`를 경과시간으로 덮어쓰기 → 백엔드 값 우선 사용
- `token_usage` stale snapshot 문제 → leader 토큰만 반환
- `useSSE.ts`에 `AbortController` 없음 → 추가
- `consensus_check` 라운드 번호 불일치 → 수정
- 미사용 `HelixMotion.tsx` 삭제
- 미사용 Tailwind 패키지 4개 제거
- debug `print`문 → `logging` 교체
- 미사용 `asyncio` import 제거
- `final_answer` SSE 이벤트에 `token_usage` 미전달 → 수정
- 예산 소진 시 빈 dict 반환 → 안전한 빈 응답 슬롯 생성
- Turn 컴포넌트 잔여 `onComplete` prop 정리
