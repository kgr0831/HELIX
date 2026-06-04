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
    graph = StateGraph(CrossCheckState)  # StateGraph 인스턴스 생성. CrossCheckState가 데이터 구조 정의함

    # 6개 노드 등록 (state 키와 이름 충돌 방지: _step 접미사)
    graph.add_node("plan_step", leader_plan_node)
    graph.add_node("researcher_step", researcher_node)
    graph.add_node("logician_step", logician_node)
    graph.add_node("critic_step", critic_node)
    graph.add_node("synthesize_step", leader_synthesize_node)
    graph.add_node("answer_step", final_answer_node)
    graph.add_node("rediscuss_step", lambda x: x)  # rediscuss_step은 그냥 병렬 노드로 다시 보내기 위한 징검다리임

    # 진입점: Leader가 먼저 작업 분배
    graph.set_entry_point("plan_step")  # 토론의 시작은 무조건 Leader부터!

    # 병렬 토론 구조: 계획 → (Researcher, Logician, Critic) → 통합
    graph.add_edge("plan_step", "researcher_step")
    graph.add_edge("plan_step", "logician_step")
    graph.add_edge("plan_step", "critic_step")
    
    graph.add_edge("researcher_step", "synthesize_step")
    graph.add_edge("logician_step", "synthesize_step")
    graph.add_edge("critic_step", "synthesize_step")

    # 조건부 엣지: 합의 시 종료, 불일치 시 재토론 (브리지 노드를 통해 회귀) - 여기서 합의됐는지 판단해서 다음 단계 결정함. 제일 중요한 로직
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

    return graph.compile()  # 마지막에 compile() 호출 안하면 실행 안됨. 까먹지 말자
