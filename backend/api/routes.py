# routes.py - FastAPI 엔드포인트 정의
# 프론트엔드와 백엔드 간 HTTP 통신을 담당하는 API 라우터

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import delete, text
from sse_starlette.sse import EventSourceResponse

from backend.api.sse import stream_helix
from backend.auth.routes import COOKIE_NAME, get_current_user
from backend.db.database import async_session
from backend.db.models import User
from backend.services.conversation import (
    create_conversation,
    delete_all_conversations,
    delete_conversation,
    get_conversation,
    list_conversations,
    rename_conversation,
)
from backend.services import apikey as apikey_service
from backend.services import settings as settings_service
from backend.services.consensus import run_consensus
from backend.services.usage import get_usage


def _max_rounds_from(prefs: dict) -> int:
    return {"1": 1, "2": 2, "3": 3}.get(prefs.get("rounds", ""), 5)

# /api 접두사로 모든 엔드포인트를 그룹화
router = APIRouter(prefix="/api")


@router.get("/health")
async def health():
    """서버 상태 확인용 헬스 체크 엔드포인트 - DB 연결 핑 포함"""
    db_ok = True
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return {"status": "ok", "db": "ok" if db_ok else "down"}


@router.get("/test-sse")
async def test_sse():
    """SSE 포맷 검증용 테스트 엔드포인트 - 브라우저에서 직접 확인"""
    from sse_starlette.sse import ServerSentEvent
    import json, asyncio

    async def gen():
        yield ServerSentEvent(event="status", data=json.dumps({"message": "test start"}))
        await asyncio.sleep(0.5)
        yield ServerSentEvent(event="agent_response", data=json.dumps({
            "agent_name": "Leader", "role": "leader",
            "phase": "planning", "content": "테스트 응답입니다."
        }))
        await asyncio.sleep(0.5)
        yield ServerSentEvent(event="done", data=json.dumps({"message": "done"}))

    return EventSourceResponse(gen())


@router.get("/debug")
async def debug():
    """백엔드 연동 디버그 - 그래프 빌드 + 전체 4 Agent 호출 테스트"""
    import traceback
    result = {"graph_build": False, "agents": {}, "error": None}
    try:
        from backend.graph.builder import build_graph
        build_graph()
        result["graph_build"] = True
    except Exception as e:
        result["error"] = f"graph_build: {e}\n{traceback.format_exc()}"
        return result

    from backend.agents.leader import LeaderAgent
    from backend.agents.researcher import ResearcherAgent
    from backend.agents.logician import LogicianAgent
    from backend.agents.critic import CriticAgent

    agents = [
        ("leader", LeaderAgent()),
        ("researcher", ResearcherAgent()),
        ("logician", LogicianAgent()),
        ("critic", CriticAgent()),
    ]
    for name, agent in agents:
        try:
            resp = await agent.generate("Say hello in one sentence.", max_tokens=50)
            result["agents"][name] = {"ok": True, "response": resp.content[:200]}
        except Exception as e:
            result["agents"][name] = {"ok": False, "error": str(e)}
    return result


@router.post("/query")
async def query(body: dict, user: User = Depends(get_current_user)):
    """질문을 받아 4-Agent 토론을 시작하고 SSE 스트림으로 결과를 반환 (로그인 필요)

    Request Body: {"question": "...", "conversation_id": "선택 — 없으면 새 대화 생성"}
    Response: SSE 스트림 (conversation, agent_response, consensus_check, final_answer 이벤트)
    """
    question = body.get("question", "")
    if not question:
        return {"error": "question is required"}

    # 기존 대화에 이어쓰거나, 없으면 새 대화 생성 (Phase 3)
    conversation_id = body.get("conversation_id")
    if not conversation_id:
        async with async_session() as session:
            conv = await create_conversation(session, user.id, question[:80])
            conversation_id = conv.id

    # 사용자 응답 기본값(라운드/언어/어조)을 엔진에 주입 (Phase A)
    async with async_session() as session:
        prefs = (await settings_service.get_settings(session, user.id))["defaults"]

    return EventSourceResponse(stream_helix(
        question, user_id=user.id, conversation_id=conversation_id,
        max_rounds=_max_rounds_from(prefs),
        language=prefs.get("language", "ko"), tone=prefs.get("tone", "balanced"),
    ))


@router.post("/v1/consensus")
async def v1_consensus(body: dict, user: User = Depends(get_current_user)):
    """API 소비자용 비스트리밍 합의 호출 (Bearer 키 또는 쿠키 인증).

    Request:  {"question": "...", "conversation_id": "선택"}
    Response: {"answer", "consensus", "token_usage", "cached", "conversation_id"}
    """
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    conversation_id = body.get("conversation_id")
    if not conversation_id:
        async with async_session() as session:
            conv = await create_conversation(session, user.id, question[:80])
            conversation_id = conv.id

    async with async_session() as session:
        prefs = (await settings_service.get_settings(session, user.id))["defaults"]

    return await run_consensus(
        question, user.id, conversation_id,
        max_rounds=_max_rounds_from(prefs),
        language=prefs.get("language", "ko"), tone=prefs.get("tone", "balanced"),
    )


@router.get("/conversations")
async def get_conversations(user: User = Depends(get_current_user)):
    """현재 사용자의 대화 목록 (최신순)"""
    async with async_session() as session:
        convs = await list_conversations(session, user.id)
        return [
            {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()}
            for c in convs
        ]


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(conversation_id: str, user: User = Depends(get_current_user)):
    """대화 상세 - 메시지 + 토론 로그(복원용)"""
    async with async_session() as session:
        conv = await get_conversation(session, conversation_id, user.id)
        if conv is None:
            raise HTTPException(status_code=404, detail="conversation not found")
        messages = []
        for m in sorted(conv.messages, key=lambda x: x.created_at):
            messages.append({
                "id": m.id,
                "question": m.question,
                "final_answer": m.final_answer,
                "consensus": m.consensus,
                "token_usage": m.token_usage,
                "events": [
                    {"round_number": e.round_number, "agent_name": e.agent_name,
                     "role": e.role, "content": e.content}
                    for e in sorted(m.events, key=lambda x: x.round_number)
                ],
            })
        return {"id": conv.id, "title": conv.title, "messages": messages}


@router.patch("/conversations/{conversation_id}")
async def rename_conversation_route(conversation_id: str, body: dict, user: User = Depends(get_current_user)):
    """대화 제목 변경"""
    title = (body.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    async with async_session() as session:
        ok = await rename_conversation(session, conversation_id, user.id, title[:500])
    if not ok:
        raise HTTPException(status_code=404, detail="conversation not found")
    return {"ok": True}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_route(conversation_id: str, user: User = Depends(get_current_user)):
    """대화 삭제"""
    async with async_session() as session:
        await delete_conversation(session, conversation_id, user.id)
    return {"ok": True}


# ── 계정/데이터 (Phase C) ──
@router.delete("/conversations")
async def clear_history(user: User = Depends(get_current_user)):
    """사용자의 모든 대화 히스토리 삭제"""
    async with async_session() as session:
        await delete_all_conversations(session, user.id)
    return {"ok": True}


@router.get("/account/export")
async def export_account(user: User = Depends(get_current_user)):
    """사용자의 전체 데이터(프로필/설정/사용량/대화)를 JSON으로 내보내기"""
    async with async_session() as session:
        convs = await list_conversations(session, user.id)
        exported = []
        for c in convs:
            detail = await get_conversation(session, c.id, user.id)
            if detail is None:
                continue
            exported.append({
                "id": detail.id,
                "title": detail.title,
                "messages": [
                    {
                        "question": m.question,
                        "final_answer": m.final_answer,
                        "consensus": m.consensus,
                        "token_usage": m.token_usage,
                        "events": [
                            {"round_number": e.round_number, "agent_name": e.agent_name, "role": e.role, "content": e.content}
                            for e in sorted(m.events, key=lambda x: x.round_number)
                        ],
                    }
                    for m in sorted(detail.messages, key=lambda x: x.created_at)
                ],
            })
        prefs = await settings_service.get_settings(session, user.id)
        usage_data = await get_usage(session, user.id)
    return {
        "user": {"email": user.email, "name": user.name},
        "settings": prefs,
        "usage": usage_data,
        "conversations": exported,
    }


@router.delete("/account")
async def delete_account(user: User = Depends(get_current_user)):
    """계정 영구 삭제 (모든 데이터 cascade) + 세션 쿠키 제거"""
    async with async_session() as session:
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp


# ── 사용량 (Phase 5) ──
@router.get("/usage")
async def usage(user: User = Depends(get_current_user)):
    async with async_session() as session:
        return await get_usage(session, user.id)


# ── 설정 (Phase 5) ──
@router.get("/settings")
async def read_settings(user: User = Depends(get_current_user)):
    async with async_session() as session:
        return await settings_service.get_settings(session, user.id)


@router.put("/settings")
async def write_settings(body: dict, user: User = Depends(get_current_user)):
    async with async_session() as session:
        return await settings_service.update_settings(
            session, user.id, body.get("theme"), body.get("defaults")
        )


# ── API 키 (Phase 5) ──
@router.get("/keys")
async def list_api_keys(user: User = Depends(get_current_user)):
    async with async_session() as session:
        return await apikey_service.list_keys(session, user.id)


@router.post("/keys")
async def create_api_key(body: dict, user: User = Depends(get_current_user)):
    async with async_session() as session:
        return await apikey_service.create_key(session, user.id, body.get("name", "기본 키"))


@router.delete("/keys/{key_id}")
async def delete_api_key(key_id: str, user: User = Depends(get_current_user)):
    async with async_session() as session:
        await apikey_service.revoke_key(session, user.id, key_id)
        return {"ok": True}
