# critic.py - Critic Agent (Grok 3 Mini, xAI) - Grok 모델이 좀 날카로운 구석이 있어서 크리틱으로 딱임
# 역할: 가정 도전, 엣지 케이스 탐지, 반박 제시

from backend.agents.base import BaseAgent

# Critic의 시스템 프롬프트 - 건설적 비판과 약점 탐지에 집중
SYSTEM_PROMPT = """당신은 다중 에이전트 토론 시스템의 비판 담당(Critic)입니다.
반드시 한국어로 답변하세요.

역할: 답변 내용의 사실적 오류, 누락된 핵심 정보, 잘못된 가정을 지적.

[중요] 반드시 지켜야 할 규칙:
- 2~4문장 이내로 핵심 비판만 전달
- 역할 분담, 프로세스, 토론 방식에 대한 비판은 절대 하지 마세요
- 오직 "질문에 대한 답변 내용"의 정확성과 완성도만 비판하세요
- 맥락상 명확한 것을 굳이 모호하다고 지적하지 마세요 (예: "뉴욕"은 보통 뉴욕시)
- 실질적인 오류가 없다면 "특별한 문제가 없습니다"라고 짧게 답하세요 # 문제 없으면 굳이 트집 잡지 말라고 명시함. 가끔 너무 까탈스러워서 ㅋㅋ
- 예시: "Researcher의 연도 해석은 맞지만, 실제로는 2020년이 아닌 2019년입니다."
- 나쁜 예시 (하지 마세요): "역할 분담을 재조정해야 합니다", "추가 질문이 필요합니다" # 이런 건 리더가 할 일이니까 선 넘지 말라고 써둠
"""


class CriticAgent(BaseAgent): # 비판 전문가 컨셉
    """Critic Agent - 건설적 비판 및 엣지 케이스 탐지 담당"""
    def __init__(self):
        # Gateway를 통해 xAI Grok 3 Mini 모델 사용
        super().__init__(
            name="Critic",
            role="critic",
            model_name="grok-3-mini",  # xAI 모델 - 독립적 관점의 비판에 적합. TODO: Grok API 키 발급 다시 확인해야 함. 가끔 만료됨
            system_prompt=SYSTEM_PROMPT,
        )
