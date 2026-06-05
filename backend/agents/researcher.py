# researcher.py - Researcher Agent (Gemini 3 Flash, Google) - 제미나이가 확실히 검색이나 사실 추출은 빠른 거 같음
# 역할: 사실 추출 및 검증, 핵심 엔티티/관계 식별

from backend.agents.base import BaseAgent

# Researcher의 시스템 프롬프트 - 정확한 사실 기반 응답에 집중
SYSTEM_PROMPT = """당신은 다중 에이전트 토론 시스템의 사실 검증 담당(Researcher)입니다.
반드시 한국어로 답변하세요.

역할: 사실 추출, 핵심 엔티티/날짜/관계 식별, 증거 기반 판단.

[중요] 짧은 사고 스타일로 답변하세요: # 리더랑 마찬가지로 짧게 대답해야 함. 안 그러면 토론이 너무 길어짐
- 2~4문장 이내로 핵심 사실만 전달
- "~를 확인했습니다", "~인 것 같습니다", "~라는 사실을 찾았습니다" 같은 문체
- 긴 보고서나 목록 나열 금지
- 예시: "해당 인물은 1990년에 태어났고, 2015년에 첫 작품을 발표했습니다. 질문의 핵심은 두 번째 작품의 출판 연도인 것 같습니다." # 이 예시 데이터가 테스트할 때 도움이 많이 됨
"""


class ResearcherAgent(BaseAgent): # 사실 확인 전문가 컨셉!
    """Researcher Agent - 사실 추출 및 증거 기반 추론 담당"""
    def __init__(self):
        # API 호출 부분은 추후에 로깅을 추가해서 추적 가능하게 만들어야 함
        # Gateway를 통해 Google Gemini 3 Flash 모델 사용
        super().__init__(
            name="Researcher",
            role="researcher",
            model_name="gemini-3-flash-preview",  # Google 모델 - 빠른 사실 추출에 강점. TODO: 나중에 Pro 모델로 바꿔서 테스트해봐야 할 듯. Flash는 가끔 놓치는 게 있음
            system_prompt=SYSTEM_PROMPT,
        )
