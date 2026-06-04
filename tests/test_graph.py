# test_graph.py - LangGraph 오케스트레이션 테스트
# 조건부 라우팅 로직과 전체 그래프 실행 흐름을 검증
# 단위 테스트: should_continue 함수, 통합 테스트: 전체 그래프 실행

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.graph.state import CrossCheckState
from backend.graph.edges import should_continue


def _make_state(**overrides) -> CrossCheckState:
    """테스트용 기본 상태를 생성하는 헬퍼 함수"""
    base: CrossCheckState = {
        "question": "test",
        "leader_plan": "",
        "agent_responses": {},
        "discussion_log": [],
        "consensus": False,
        "round_number": 1,
        "max_rounds": 3,
        "final_answer": "",
        "token_usage": {},
    }
    base.update(overrides)  # 오버라이드할 필드만 교체
    return base


def test_should_continue_consensus():
    """합의 도달 시 final_answer로 라우팅되는지 검증"""
    state = _make_state(consensus=True)
    assert should_continue(state) == "answer_step"


def test_should_continue_max_rounds():
    """최대 라운드 도달 시 강제 종료되는지 검증 (비용 폭발 방지)"""
    state = _make_state(consensus=False, round_number=3, max_rounds=3)
    assert should_continue(state) == "answer_step"


def test_should_continue_no_consensus():
    """불일치 + 라운드 여유 있을 때 재토론으로 라우팅되는지 검증"""
    state = _make_state(consensus=False, round_number=1, max_rounds=3)
    assert should_continue(state) == "rediscuss_step"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_graph_execution():
    """전체 LangGraph 그래프 실행 통합 테스트 - 4 Agent 토론 end-to-end"""
    from backend.graph.builder import build_graph

    graph = build_graph()
    # 간단한 질문으로 전체 흐름 테스트
    result = await graph.ainvoke({
        "question": "What is the capital of France?",
        "leader_plan": "",
        "agent_responses": {},
        "discussion_log": [],
        "consensus": False,
        "round_number": 0,
        "max_rounds": 3,
        "final_answer": "",
        "token_usage": {},
    })
    # 최종 답변과 토큰 사용량이 생성되었는지 확인
    assert result["final_answer"]
    assert result["token_usage"]
