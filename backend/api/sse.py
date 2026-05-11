# sse.py - Server-Sent Events 스트리밍
# LangGraph 실행 중 각 노드 완료 시 실시간으로 프론트엔드에 이벤트를 전송
# Glass Box UI에서 4-Agent 토론 과정을 실시간 시각화하기 위한 핵심 모듈

import json
import traceback
import uuid
from typing import AsyncGenerator

from sse_starlette.sse import ServerSentEvent

from backend.graph.builder import build_graph
from backend.graph.state import CrossCheckState


# 노드 진입 전 표시할 진행 상태 메시지
_NODE_STATUS = {
    "plan_step": "Leader가 질문을 분석하고 작업을 분배하는 중...",
    "researcher_step": "Researcher가 사실 관계를 확인하는 중...",
    "logician_step": "Logician이 논리적 타당성을 검토하는 중...",
    "critic_step": "Critic이 반박 및 엣지 케이스를 탐색하는 중...",
    "synthesize_step": "Leader가 응답을 통합하고 합의를 확인하는 중...",
    "answer_step": "최종 답변을 생성하는 중...",
}


async def stream_helix(question: str) -> AsyncGenerator[ServerSentEvent, None]:
    """질문을 받아 LangGraph를 실행하며, 각 단계를 SSE 이벤트로 스트리밍"""
    try:
        graph = build_graph()
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
        "max_rounds": 3,
        "final_answer": "",
        "token_usage": {},
    }

    yield _make_event("status", {"message": "HELIX 토론을 시작합니다...", "phase": "init"})

    seen_nodes = set()

    try:
        async for event in graph.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                # 새 노드 진입 시 상태 메시지 전송
                print(f"[GRAPH] Executing node: {node_name}")
                if node_name not in seen_nodes and node_name in _NODE_STATUS:
                    seen_nodes.add(node_name)
                    yield _make_event("status", {
                        "message": _NODE_STATUS[node_name],
                        "phase": node_name,
                    })

                if node_name == "plan_step":
                    yield _make_event("agent_response", {
                        "id": str(uuid.uuid4()),
                        "agent_name": "Leader",
                        "role": "leader",
                        "phase": "planning",
                        "content": node_output.get("leader_plan", ""),
                    })

                elif node_name in ["researcher_step", "logician_step", "critic_step"]:
                    # 병렬 토론 진입 시 상태 메시지 전송
                    # node_output['round_number']가 있으면 그것을 쓰고, 없으면 1로 간주
                    round_num = node_output.get("round_number", 1)
                    if f"parallel_start_{round_num}" not in seen_nodes:
                        seen_nodes.add(f"parallel_start_{round_num}")
                        if round_num == 1:
                            msg = "에이전트들이 답변을 생성하는 중..."
                        else:
                            msg = f"합의 미달 — {round_num}차 재토론 진행 중..."
                        
                        yield _make_event("status", {
                            "message": msg,
                            "phase": f"parallel_{round_num}",
                        })
                    responses = node_output.get("agent_responses", {})
                    for role, resp in responses.items():
                        yield _make_event("agent_response", {
                            "id": str(uuid.uuid4()),
                            "agent_name": resp["agent_name"],
                            "role": resp["role"],
                            "phase": "discussion",
                            "round_number": node_output.get("round_number"),
                            "content": resp["content"],
                            "token_count": resp["token_count"],
                            "latency_ms": resp["latency_ms"],
                        })

                elif node_name == "synthesize_step":
                    consensus = node_output.get("consensus", False)
                    round_num = node_output.get("round_number", 1)
                    log = node_output.get("discussion_log", [])
                    last_entry = log[-1] if log else {}
                    
                    # 1. 합의 판정 상태 이벤트
                    yield _make_event("consensus_check", {
                        "consensus": consensus,
                        "round": round_num,
                        "content": last_entry.get("content", ""),
                    })
                    
                    # 2. 리더의 종합 의견을 Turn으로 표시
                    yield _make_event("agent_response", {
                        "id": str(uuid.uuid4()),
                        "agent_name": "Leader",
                        "role": "leader",
                        "phase": "discussion", # 병렬 토론 라운드에 포함시키기 위함
                        "round_number": round_num - 1, # 현재 라운드의 결과이므로 -1
                        "content": f"**합의 여부: {'YES' if consensus else 'NO'}**\n\n{last_entry.get('content', '')}",
                    })

                elif node_name == "answer_step":
                    yield _make_event("final_answer", {
                        "answer": node_output.get("final_answer", ""),
                        "consensus": node_output.get("consensus", False),
                        "token_usage": node_output.get("token_usage", initial_state.get("token_usage", {})),
                    })

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[HELIX ERROR] {e}\n{tb}")
        yield _make_event("error", {"message": str(e)})
        return

    yield _make_event("done", {"message": "Discussion complete."})


def _make_event(event_type: str, data: dict) -> ServerSentEvent:
    """sse-starlette의 ServerSentEvent 객체를 생성 (이중 포맷 방지)"""
    return ServerSentEvent(event=event_type, data=json.dumps(data, ensure_ascii=False))
