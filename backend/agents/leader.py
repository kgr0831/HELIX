# leader.py - Leader Agent (GPT-5.4-mini, OpenAI) - gpt-5.4-mini 성능 괜찮은 듯. 리더는 판단만 하면 되니까 이걸로 충분함
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
- 예시: "이 질문은 두 단계로 나눠서 접근하겠습니다. Researcher에게 사실 확인을, Logician에게 논리 검증을 맡기겠습니다." # 이 예시대로 잘 따라야 되는데 가끔 말이 길어짐... 프롬프트 더 깎아야 하나

최종 답변 생성 시에만 상세하게 작성하세요.""" # 최종 답변은 또 길게 써야 됨. 요구사항이 까다롭네


class LeaderAgent(BaseAgent):  # BaseAgent 상속받아서 만듬. 나중에 다른 모델로 바꾸기 편하게
    """Leader Agent - MAS 오케스트레이션의 중심 역할"""
    def __init__(self):
        # Gateway를 통해 OpenAI gpt-5.4-mini 모델 사용
        super().__init__(
            name="Leader",
            role="leader",
            model_name="gpt-5.4-mini",  # OpenAI 경량 모델 - 빠른 조율에 적합
            system_prompt=SYSTEM_PROMPT,
        )  # TODO: 온도(temperature) 값을 좀 더 낮춰서 일관성을 높여야 할 듯
