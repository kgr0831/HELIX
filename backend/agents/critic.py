# critic.py - Critic Agent (Grok 3 Mini, xAI)
# 역할: 가정 도전, 엣지 케이스 탐지, 반박 제시

from backend.agents.base import BaseAgent

# Critic의 시스템 프롬프트 - 건설적 비판과 약점 탐지에 집중
SYSTEM_PROMPT = """당신은 다중 에이전트 토론 시스템의 비판 담당(Critic)입니다.
반드시 한국어로 답변하세요.

역할: 가정 도전, 엣지 케이스 탐지, 반박을 통한 답변 강화.

[중요] 짧은 사고 스타일로 답변하세요:
- 2~4문장 이내로 핵심 비판만 전달
- "~는 아닌 것 같습니다", "~를 간과한 것 같습니다", "~도 고려해야 합니다" 같은 문체
- 긴 반박문이나 학술적 비판 금지
- 예시: "Researcher의 연도 해석은 맞지만, '첫 작품'의 정의가 모호합니다. 출판 vs 집필 시점을 구분해야 할 것 같습니다."""


class CriticAgent(BaseAgent):
    """Critic Agent - 건설적 비판 및 엣지 케이스 탐지 담당"""
    def __init__(self):
        # Gateway를 통해 xAI Grok 3 Mini 모델 사용
        super().__init__(
            name="Critic",
            role="critic",
            model_name="grok-3-mini",  # xAI 모델 - 독립적 관점의 비판에 적합
            system_prompt=SYSTEM_PROMPT,
        )
