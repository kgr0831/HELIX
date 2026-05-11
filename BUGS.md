# HELIX Multi-Agent Debate System - Persistent Bugs

## 1. UI Status Discrepancy
- **Issue**: The status message "재토론 답변 생성 중..." (Generating rediscussion answer...) appears during Round 1, which should only show "답변 생성 중..." (Generating answer...).
- **Observation**: The system seems to misidentify the current round or the "rediscussion" state prematurely.
- **Impact**: Confusion for the user regarding the current phase of the debate.

## 2. Final Answer Rendering Failure
- **Issue**: Even when the Glass Box shows that all turns (e.g., 5 turns) are complete and the loading state is finished, the Final Answer component fails to render at the bottom.
- **Observation**: The `allTypingDone` state in `Thread` component likely remains `false` because the count of completed animations does not match the expected number of events, or there is a race condition between `isLoading` and animation completion.
- **Impact**: The user never sees the synthesized conclusion.

## 3. Consensus Label Mismatch
- **Issue**: The Glass Box header shows "합의 도달" (Consensus reached) even when the agents' content clearly shows disagreements or contradictions.
- **Observation**: The Leader model may be too lenient in its JSON `consensus` output, or the frontend is defaulting to "Consensus reached" when it should show "No Consensus".
- **Impact**: Misleading indication of the debate's outcome.

## 4. Animation Sync Instability
- **Issue**: The logic to wait for all agent typing animations (`onComplete` callbacks) before showing the final answer is fragile and frequently hangs.
- **Observation**: Using a `Set` of IDs and comparing to `events.filter(...)` length is sensitive to how events are counted and when they arrive.
- **Impact**: Final answer is blocked indefinitely.
