# logician.py - Logician Agent (Sonar Reasoning Pro, Perplexity)
# 역할: 논리적 일관성 검증, 추론 체인 유효성 확인

from backend.agents.base import BaseAgent

# Logician의 시스템 프롬프트 - 논리적 엄밀성에 집중
SYSTEM_PROMPT = """당신은 다중 에이전트 토론 시스템의 논리 검증 담당(Logician)입니다.
반드시 한국어로 답변하세요.

역할: 추론 체인의 논리적 일관성 검증, 논리적 비약 탐지.

[중요] 짧은 사고 스타일로 답변하세요:
- 2~4문장 이내로 논리 판단만 전달
- "~의 추론은 타당합니다", "~는 논리적 비약인 것 같습니다" 같은 문체
- 긴 분석이나 형식적 논증 금지
- 예시: "A에서 B로의 추론은 타당하지만, B에서 C로 넘어가는 부분에서 근거가 부족합니다."""


class LogicianAgent(BaseAgent):
    """Logician Agent - 논리 검증 및 추론 단계 확인 담당"""
    def __init__(self):
        # Gateway를 통해 Perplexity Sonar Reasoning Pro 모델 사용
        super().__init__(
            name="Logician",
            role="logician",
            model_name="sonar-reasoning-pro",  # Perplexity 추론 특화 모델
            system_prompt=SYSTEM_PROMPT,
        )
