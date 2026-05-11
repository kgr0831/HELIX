# builder.py - LangGraph 그래프 빌드
# Parallel-Roles 아키텍처: Leader → 3 Agent 병렬 → Leader 통합 → 합의/재토론
# 노드 이름은 state 키와 충돌 방지를 위해 _step 접미사 사용

from langgraph.graph import StateGraph, END

from backend.graph.state import CrossCheckState
from backend.graph.nodes import (
    leader_plan_node,
    researcher_node,
    logician_node,
    critic_node,
    leader_synthesize_node,
    final_answer_node,
)
from backend.graph.edges import should_continue


def build_graph():
    """LangGraph 상태 그래프를 구성하고 컴파일하여 반환"""
    graph = StateGraph(CrossCheckState)

    # 6개 노드 등록 (state 키와 이름 충돌 방지: _step 접미사)
    graph.add_node("plan_step", leader_plan_node)
    graph.add_node("researcher_step", researcher_node)
    graph.add_node("logician_step", logician_node)
    graph.add_node("critic_step", critic_node)
    graph.add_node("synthesize_step", leader_synthesize_node)
    graph.add_node("answer_step", final_answer_node)
    graph.add_node("rediscuss_step", lambda x: x)

    # 진입점: Leader가 먼저 작업 분배
    graph.set_entry_point("plan_step")

    # 병렬 토론 구조: 계획 → (Researcher, Logician, Critic) → 통합
    graph.add_edge("plan_step", "researcher_step")
    graph.add_edge("plan_step", "logician_step")
    graph.add_edge("plan_step", "critic_step")
    
    graph.add_edge("researcher_step", "synthesize_step")
    graph.add_edge("logician_step", "synthesize_step")
    graph.add_edge("critic_step", "synthesize_step")

    # 조건부 엣지: 합의 시 종료, 불일치 시 재토론 (브리지 노드를 통해 회귀)
    graph.add_conditional_edges(
        "synthesize_step",
        should_continue,
        {
            "answer_step": "answer_step",
            "rediscuss_step": "rediscuss_step",
        },
    )

    # 브리지 노드 -> 3인 에이전트로 병렬 분기
    graph.add_edge("rediscuss_step", "researcher_step")
    graph.add_edge("rediscuss_step", "logician_step")
    graph.add_edge("rediscuss_step", "critic_step")

    # 최종 답변 → 그래프 종료
    graph.add_edge("answer_step", END)

    return graph.compile()
