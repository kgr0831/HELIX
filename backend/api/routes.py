# routes.py - FastAPI 엔드포인트 정의
# 프론트엔드와 백엔드 간 HTTP 통신을 담당하는 API 라우터

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from backend.api.sse import stream_helix

# /api 접두사로 모든 엔드포인트를 그룹화
router = APIRouter(prefix="/api")


@router.get("/health")
async def health():
    """서버 상태 확인용 헬스 체크 엔드포인트"""
    return {"status": "ok"}


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
async def query(body: dict):
    """질문을 받아 4-Agent 토론을 시작하고 SSE 스트림으로 결과를 반환

    Request Body: {"question": "Multi-hop 질문 텍스트"}
    Response: SSE 스트림 (agent_response, consensus_check, final_answer 이벤트)
    """
    question = body.get("question", "")
    # 질문이 비어있으면 에러 반환
    if not question:
        return {"error": "question is required"}
    # SSE 스트리밍 응답으로 실시간 토론 과정 전송
    return EventSourceResponse(stream_helix(question))
