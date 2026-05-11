# state.py - LangGraph 상태 정의
# 4-Agent 토론 과정의 모든 데이터를 추적하는 상태 구조

from typing import TypedDict, Annotated
import operator

def merge_dict(a: dict, b: dict) -> dict:
    return {**a, **b}



class AgentResponseDict(TypedDict):
    """개별 Agent 응답 딕셔너리 - LangGraph 상태에 저장되는 형식"""
    agent_name: str    # Agent 이름
    role: str          # Agent 역할 (leader, researcher, logician, critic)
    content: str       # 응답 내용
    token_count: int   # 사용된 토큰 수
    latency_ms: float  # 응답 지연시간


class DiscussionEntry(TypedDict):
    """토론 로그 항목 - 각 라운드별 Agent 발언 기록"""
    round_number: int  # 토론 라운드 번호
    agent_name: str    # 발언한 Agent 이름
    role: str          # Agent 역할
    content: str       # 발언 내용


class CrossCheckState(TypedDict):
    """LangGraph 메인 상태 - 전체 토론 흐름을 관리하는 핵심 구조체"""
    question: str                              # 입력된 Multi-hop 질문
    leader_plan: str                           # Leader의 작업 분배 계획
    agent_responses: Annotated[dict[str, AgentResponseDict], merge_dict]  # 현재 라운드의 Agent 응답들
    discussion_log: Annotated[list[DiscussionEntry], operator.add]      # 전체 토론 히스토리
    consensus: bool                            # 합의 도달 여부
    round_number: int                          # 현재 라운드 번호
    max_rounds: int                            # 최대 토론 라운드 수 (비용 폭발 방지)
    final_answer: str                          # 최종 통합 답변
    token_usage: Annotated[dict[str, int], merge_dict]                # Agent별 누적 토큰 사용량
