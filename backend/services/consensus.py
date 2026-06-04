# consensus.py - 비스트리밍 합의 실행 (Phase G / API 소비자용)
# stream_helix의 SSE 버전과 달리, 토론을 끝까지 돌려 최종 결과를 JSON으로 한 번에 반환.
# 캐싱·영구화·사용량 집계는 동일하게 적용 (서비스 경로이므로).

import logging

from backend.db.database import async_session
from backend.graph.builder import build_graph
from backend.graph.state import CrossCheckState
from backend.services import cache as cache_service
from backend.services.conversation import save_message
from backend.services.usage import increment_usage

logger = logging.getLogger(__name__)


async def run_consensus(
    question: str,
    user_id: str,
    conversation_id: str,
    max_rounds: int = 5,
    language: str = "ko",
    tone: str = "balanced",
) -> dict:
    """질문에 대해 4-Agent 토론을 끝까지 실행하고 최종 결과를 dict로 반환."""
    # 캐시 조회
    q_embedding = None
    hit = None
    if cache_service.ENABLED:
        try:
            q_embedding = cache_service.embed(question)
            async with async_session() as session:
                hit = await cache_service.find_similar(session, q_embedding)
        except Exception:
            logger.exception("cache lookup failed (consensus)")

    if hit:
        answer, consensus, events = hit["final_answer"], hit["consensus"], hit["agent_events"]
        token_usage: dict = {}
        cached = True
    else:
        graph = build_graph()
        state = await graph.ainvoke({
            "question": question, "leader_plan": "", "agent_responses": {},
            "discussion_log": [], "consensus": False, "round_number": 0,
            "max_rounds": max_rounds, "final_answer": "", "token_usage": {},
            "language": language, "tone": tone,
        })
        answer = state.get("final_answer", "")
        consensus = state.get("consensus", False)
        token_usage = state.get("token_usage", {})
        events = state.get("discussion_log", [])
        cached = False
        # 캐시에 저장
        if q_embedding is not None and answer:
            try:
                async with async_session() as session:
                    await cache_service.store(session, question, q_embedding, answer, consensus, events)
            except Exception:
                logger.exception("cache store failed (consensus)")

    # 대화 영구화 + 사용량 집계
    try:
        async with async_session() as session:
            await save_message(session, conversation_id, question, answer, consensus, token_usage, 0.0, events)
    except Exception:
        logger.exception("persist failed (consensus)")
    try:
        async with async_session() as session:
            await increment_usage(session, user_id, tokens=sum(token_usage.values()), calls=1)
    except Exception:
        logger.exception("usage increment failed (consensus)")

    return {
        "answer": answer,
        "consensus": consensus,
        "token_usage": token_usage,
        "cached": cached,
        "conversation_id": conversation_id,
    }
