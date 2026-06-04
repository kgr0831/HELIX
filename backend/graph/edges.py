# edges.py - LangGraph 조건부 라우팅 정의
# 합의 여부와 최대 라운드에 따라 토론 계속/종료를 결정

from backend.graph.state import CrossCheckState


def should_continue(state: CrossCheckState): # 다음 단계 어디로 갈지 정하는 라우터 함수
    # 합의 여부 확인
    if state.get("consensus", False): # 합의됐으면 바로 답변 만들러 감
        return "answer_step"
    
    # 라운드 제한 확인 (안전장치 상향) - 무한 루프 돌면 내 지갑 털리니까 안전장치 필수
    curr_round = state.get("round_number", 1)
    if curr_round >= state.get("max_rounds", 5):
        return "answer_step" # 최대 라운드 찍어도 그냥 답변 만들러 보냄
        
    # 합의 미달 시 재토론 진행
    return "rediscuss_step" # 아쉬우면 한 번 더! (재토론)
