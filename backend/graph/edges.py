# edges.py - LangGraph 조건부 라우팅 정의
# 합의 여부와 최대 라운드에 따라 토론 계속/종료를 결정

from backend.graph.state import CrossCheckState


def should_continue(state: CrossCheckState):
    # 합의 여부 확인
    if state.get("consensus", False):
        return "answer_step"
    
    # 라운드 제한 확인 (안전장치 상향)
    curr_round = state.get("round_number", 1)
    if curr_round >= state.get("max_rounds", 10):
        return "answer_step"
        
    # 합의 미달 시 재토론 진행
    return "rediscuss_step"
