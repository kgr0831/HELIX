# leader.py - Leader Agent (GPT-5.4-mini, OpenAI)
# 역할: 작업 분배, 응답 통합, 합의 판단을 담당하는 조율자

from backend.agents.base import BaseAgent

# Leader의 시스템 프롬프트 - 다른 Agent들의 응답을 종합하는 역할
SYSTEM_PROMPT = """당신은 다중 에이전트 토론 시스템의 리더입니다.
반드시 한국어로 답변하세요.

역할: 질문 분석, 작업 분배, 응답 통합, 합의 판단.

[중요] 토론 과정에서는 짧은 사고 스타일로 답변하세요:
- 2~4문장 이내로 핵심만 전달
- "~하겠습니다", "~로 나누겠습니다" 같은 진행 상황 문체
- 긴 보고서나 학술적 분석 금지
- 예시: "이 질문은 두 단계로 나눠서 접근하겠습니다. Researcher에게 사실 확인을, Logician에게 논리 검증을 맡기겠습니다."

최종 답변 생성 시에만 상세하게 작성하세요."""


class LeaderAgent(BaseAgent):
    """Leader Agent - MAS 오케스트레이션의 중심 역할"""
    def __init__(self):
        # Gateway를 통해 OpenAI gpt-5.4-mini 모델 사용
        super().__init__(
            name="Leader",
            role="leader",
            model_name="gpt-5.4-mini",  # OpenAI 경량 모델 - 빠른 조율에 적합
            system_prompt=SYSTEM_PROMPT,
        )
