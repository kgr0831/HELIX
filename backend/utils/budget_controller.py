# budget_controller.py - Token Budget 제어 메커니즘
# Tran & Kiela 논문의 핵심: SAS와 MAS의 공정 비교를 위해 동일 토큰 예산 적용
# SAS 8000 tokens = MAS 4 agents × 2000 tokens

from backend.utils.token_counter import count_tokens

# 단일 Agent 시스템(SAS)의 총 토큰 예산
SAS_BUDGET = 8000

# 다중 Agent 시스템(MAS)의 Agent별 토큰 예산 - 합계가 SAS_BUDGET과 동일
MAS_BUDGET_PER_AGENT = {
    "leader": 2000,      # 작업 분배 + 통합
    "researcher": 2000,  # 사실 추출
    "logician": 2000,    # 논리 검증
    "critic": 2000,      # 비판/반박
}


class BudgetController:
    """토큰 예산을 관리하여 SAS와 MAS 간 공정한 비교를 보장하는 컨트롤러"""

    def __init__(self, mode: str = "mas"):
        """mode: 'mas' (다중 Agent) 또는 'sas' (단일 Agent)"""
        self.mode = mode
        if mode == "mas":
            self.budgets = dict(MAS_BUDGET_PER_AGENT)
        else:
            self.budgets = {"sas": SAS_BUDGET}
        # Agent별 실제 토큰 사용량 추적
        self.usage: dict[str, int] = {k: 0 for k in self.budgets}

    def remaining(self, agent_name: str) -> int:
        """해당 Agent의 잔여 토큰 예산을 반환"""
        return self.budgets[agent_name] - self.usage.get(agent_name, 0)

    def consume(self, agent_name: str, text: str) -> int:
        """텍스트의 토큰을 소비하고 사용량을 갱신, 소비된 토큰 수 반환"""
        tokens = count_tokens(text)
        self.usage[agent_name] = self.usage.get(agent_name, 0) + tokens
        return tokens

    def check_budget(self, agent_name: str, tokens: int) -> bool:
        """해당 Agent가 tokens만큼 사용 가능한지 확인"""
        return self.remaining(agent_name) >= tokens

    def truncate_to_budget(self, agent_name: str, text: str) -> str:
        """텍스트를 잔여 예산 내로 잘라서 반환 (예산 초과 방지)"""
        remaining = self.remaining(agent_name)
        if remaining <= 0:
            return ""
        tokens = count_tokens(text)
        if tokens <= remaining:
            return text
        # 예산 초과 시 토큰 단위로 잘라냄
        import tiktoken
        encoder = tiktoken.get_encoding("cl100k_base")
        encoded = encoder.encode(text)[:remaining]
        return encoder.decode(encoded)

    def total_usage(self) -> int:
        """전체 Agent의 총 토큰 사용량 반환"""
        return sum(self.usage.values())

    def summary(self) -> dict:
        """현재 예산 상태를 딕셔너리로 반환 (디버깅/로깅용)"""
        return {
            "mode": self.mode,
            "budgets": self.budgets,
            "usage": self.usage,
            "total": self.total_usage(),
        }
