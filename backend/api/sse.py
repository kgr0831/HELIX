# sse.py - Server-Sent Events 스트리밍
# LangGraph 실행 중 각 노드 완료 시 실시간으로 프론트엔드에 이벤트를 전송
# Glass Box UI에서 4-Agent 토론 과정을 실시간 시각화하기 위한 핵심 모듈

import json
import logging
import time
import uuid
from typing import AsyncGenerator

logger = logging.getLogger(__name__)  # 로깅 설정. 배포할 때는 수준 조절해야 할지도?

from sse_starlette.sse import ServerSentEvent

from backend.db.database import async_session
from backend.graph.builder import build_graph
from backend.graph.state import CrossCheckState
from backend.services import cache as cache_service
from backend.services.conversation import save_message
from backend.services.usage import increment_usage


# 노드 진입 전 표시할 진행 상태 메시지
_NODE_STATUS = {
    "plan_step": "Leader가 질문을 분석하고 작업을 분배하는 중...",
    "researcher_step": "Researcher가 사실 관계를 확인하는 중...",
    "logician_step": "Logician이 논리적 타당성을 검토하는 중...",
    "critic_step": "Critic이 반박 및 엣지 케이스를 탐색하는 중...",
    "synthesize_step": "Leader가 응답을 통합하고 합의를 확인하는 중...",
    "answer_step": "최종 답변을 생성하는 중...",
}


async def stream_helix(
    question: str,
    user_id: str | None = None,
    conversation_id: str | None = None,
    max_rounds: int = 5,
    language: str = "ko",
    tone: str = "balanced",
) -> AsyncGenerator[ServerSentEvent, None]:
    """질문을 받아 LangGraph를 실행하며, 각 단계를 SSE 이벤트로 스트리밍.
    user_id/conversation_id가 주어지면 토론 종료 후 DB에 영구 저장한다 (Phase 3).
    max_rounds/language/tone은 사용자 설정에서 주입된다 (Phase A)."""
    try:
        graph = build_graph()  # 그래프 빌드하는 부분인데 여기서 에러나면 바로 리턴함
    except Exception as e:
        yield _make_event("error", {"message": f"그래프 빌드 실패: {e}"})
        return

    initial_state: CrossCheckState = {
        "question": question,
        "leader_plan": "",
        "agent_responses": {},
        "discussion_log": [],
        "consensus": False,
        "round_number": 0,
        "max_rounds": max_rounds,
        "final_answer": "",
        "token_usage": {},
        "language": language,
        "tone": tone,
    }

    yield _make_event("status", {"message": "HELIX 토론을 시작합니다...", "phase": "init"})

    # 프론트가 현재 대화를 추적할 수 있도록 conversation_id를 먼저 알림
    if conversation_id:
        yield _make_event("conversation", {"conversation_id": conversation_id})

    seen_nodes = set()  # 중복 이벤트 방지하려고 set 사용함. 프론트에서 깜빡거리는 거 잡느라 고생함..
    current_round = 1

    # DB 영구화용 누적 버퍼 (Phase 3)
    events_for_db: list[dict] = []
    final_answer_text = ""
    final_consensus = False
    final_tokens: dict = {}
    t0 = time.perf_counter()

    # Phase 4: 답변 캐시 조회 (유사 질문이 있으면 토론을 건너뛰고 즉시 재생)
    q_embedding = None
    try:
        q_embedding = cache_service.embed(question)
        async with async_session() as session:
            hit = await cache_service.find_similar(session, q_embedding)
    except Exception:
        logger.exception("cache lookup failed")
        hit = None

    if hit:
        yield _make_event("status", {
            "message": f"유사한 질문의 캐시된 답변을 불러왔습니다 (유사도 {hit['similarity']:.2f})",
            "phase": "cache_hit",
        })
        for e in hit["agent_events"]:
            yield _make_event("agent_response", {
                "id": str(uuid.uuid4()),
                "agent_name": e["agent_name"],
                "role": e["role"],
                "phase": "planning" if e["round_number"] == 0 else "discussion",
                "round_number": e["round_number"],
                "content": e["content"],
            })
        # GlassBox 합의 라벨이 consensus_check 이벤트 기준이므로 동일 포맷으로 1건 전송
        yield _make_event("consensus_check", {
            "consensus": hit["consensus"], "round": 1, "content": "",
        })
        yield _make_event("final_answer", {
            "answer": hit["final_answer"],
            "consensus": hit["consensus"],
            "token_usage": {},  # 캐시 적중은 신규 토큰 소비 0
            "cached": True,
        })
        # 캐시 적중도 대화 이력에는 저장 (복원 가능하도록)
        if user_id and conversation_id:
            try:
                async with async_session() as session:
                    await save_message(
                        session, conversation_id, question,
                        hit["final_answer"], hit["consensus"], {},
                        (time.perf_counter() - t0) * 1000, hit["agent_events"],
                    )
            except Exception:
                logger.exception("cached message persist failed")
            try:
                async with async_session() as session:
                    await increment_usage(session, user_id, tokens=0, calls=1)  # 캐시 적중: 호출 1, 토큰 0
            except Exception:
                logger.exception("usage increment (cache) failed")
        yield _make_event("done", {"message": "Served from cache."})
        return

    try:
        async for event in graph.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                # 새 노드 진입 시 상태 메시지 전송
                logger.debug("Executing node: %s", node_name)
                if node_name not in seen_nodes and node_name in _NODE_STATUS:
                    seen_nodes.add(node_name)
                    yield _make_event("status", {
                        "message": _NODE_STATUS[node_name],
                        "phase": node_name,
                    })

                if node_name == "plan_step":
                    current_round = node_output.get("round_number", 1)
                    plan_text = node_output.get("leader_plan", "")
                    events_for_db.append({
                        "round_number": 0, "agent_name": "Leader", "role": "leader",
                        "content": plan_text,
                    })
                    yield _make_event("agent_response", {
                        "id": str(uuid.uuid4()),
                        "agent_name": "Leader",
                        "role": "leader",
                        "phase": "planning",
                        "content": plan_text,
                    })

                elif node_name in ["researcher_step", "logician_step", "critic_step"]:
                    if f"parallel_start_{current_round}" not in seen_nodes:
                        seen_nodes.add(f"parallel_start_{current_round}")
                        if current_round == 1:
                            msg = "에이전트들이 답변을 생성하는 중..."
                        else:
                            msg = f"합의 미달 — {current_round}차 재토론 진행 중..."  # 70% 진행률이라 재토론 로직은 아직 테스트 중. 가끔 무한 루프 도는 거 같기도?

                        yield _make_event("status", {
                            "message": msg,
                            "phase": f"parallel_{current_round}",
                        })
                    responses = node_output.get("agent_responses", {})
                    for role, resp in responses.items():
                        events_for_db.append({
                            "round_number": current_round,
                            "agent_name": resp["agent_name"],
                            "role": resp["role"],
                            "content": resp["content"],
                        })
                        yield _make_event("agent_response", {
                            "id": str(uuid.uuid4()),
                            "agent_name": resp["agent_name"],
                            "role": resp["role"],
                            "phase": "discussion",
                            "round_number": current_round,
                            "content": resp["content"],
                            "token_count": resp["token_count"],
                            "latency_ms": resp["latency_ms"],
                        })

                elif node_name == "synthesize_step":
                    consensus = node_output.get("consensus", False)
                    next_round = node_output.get("round_number", current_round + 1)
                    log = node_output.get("discussion_log", [])
                    last_entry = log[-1] if log else {}

                    # 1. 합의 판정 상태 이벤트
                    yield _make_event("consensus_check", {
                        "consensus": consensus,
                        "round": current_round,
                        "content": last_entry.get("content", ""),
                    })

                    # 2. 리더의 종합 의견을 Turn으로 표시
                    synth_content = f"**합의 여부: {'YES' if consensus else 'NO'}**\n\n{last_entry.get('content', '')}"
                    events_for_db.append({
                        "round_number": current_round, "agent_name": "Leader", "role": "leader",
                        "content": synth_content,
                    })
                    yield _make_event("agent_response", {
                        "id": str(uuid.uuid4()),
                        "agent_name": "Leader",
                        "role": "leader",
                        "phase": "discussion",
                        "round_number": current_round,
                        "content": synth_content,
                    })

                    # 다음 라운드로 갱신 (재토론 시 사용)
                    current_round = next_round

                elif node_name == "answer_step":
                    final_answer_text = node_output.get("final_answer", "")
                    final_consensus = node_output.get("consensus", False)
                    final_tokens = node_output.get("token_usage", initial_state.get("token_usage", {}))
                    yield _make_event("final_answer", {
                        "answer": final_answer_text,
                        "consensus": final_consensus,
                        "token_usage": final_tokens,
                        "cached": False,
                    })

    except Exception as e:
        logger.exception("HELIX stream error")
        yield _make_event("error", {"message": str(e)})
        return

    # 토론 종료 후 DB 영구 저장 (Phase 3) - 저장 실패가 응답을 막지 않도록 격리
    if user_id and conversation_id:
        try:
            async with async_session() as session:
                await save_message(
                    session, conversation_id, question,
                    final_answer_text, final_consensus, final_tokens,
                    (time.perf_counter() - t0) * 1000, events_for_db,
                )
        except Exception:
            logger.exception("conversation persist failed")
        try:
            async with async_session() as session:
                await increment_usage(session, user_id, tokens=sum(final_tokens.values()), calls=1)
        except Exception:
            logger.exception("usage increment failed")

    # Phase 4: 캐시 MISS였으므로 결과를 캐시에 저장 (다음 유사 질문에 재사용)
    if q_embedding is not None and final_answer_text:
        try:
            async with async_session() as session:
                await cache_service.store(
                    session, question, q_embedding,
                    final_answer_text, final_consensus, events_for_db,
                )
        except Exception:
            logger.exception("cache store failed")

    yield _make_event("done", {"message": "Discussion complete."})


def _make_event(event_type: str, data: dict) -> ServerSentEvent:
    """sse-starlette의 ServerSentEvent 객체를 생성 (이중 포맷 방지) - json 인코딩할 때 한글 안깨지게 처리함"""
    return ServerSentEvent(event=event_type, data=json.dumps(data, ensure_ascii=False))
