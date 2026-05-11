# test_budget.py - Token Budget Controller 단위 테스트
# SAS(8000)와 MAS(2000x4) 예산이 동일하게 매칭되는지 검증
# Tran & Kiela 논문의 핵심 전제: 공정한 토큰 예산 비교

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.utils.budget_controller import BudgetController
from backend.utils.token_counter import count_tokens


def test_mas_budget_init():
    """MAS 모드 초기화 - 4개 Agent에 각 2000 토큰 할당 확인"""
    bc = BudgetController(mode="mas")
    assert bc.budgets == {"leader": 2000, "researcher": 2000, "logician": 2000, "critic": 2000}
    assert bc.total_usage() == 0


def test_sas_budget_init():
    """SAS 모드 초기화 - 단일 모델에 8000 토큰 할당 확인"""
    bc = BudgetController(mode="sas")
    assert bc.budgets == {"sas": 8000}


def test_consume_and_remaining():
    """토큰 소비 후 잔여량이 정확히 감소하는지 검증"""
    bc = BudgetController(mode="mas")
    text = "Hello world this is a test"
    tokens = bc.consume("leader", text)
    assert tokens > 0
    assert bc.remaining("leader") == 2000 - tokens


def test_check_budget():
    """예산 초과 여부 판단이 올바른지 검증"""
    bc = BudgetController(mode="mas")
    assert bc.check_budget("leader", 1500) is True   # 예산 내
    assert bc.check_budget("leader", 2500) is False   # 예산 초과


def test_truncate_to_budget():
    """예산 초과 텍스트가 정확히 잘리는지 검증"""
    bc = BudgetController(mode="mas")
    bc.usage["leader"] = 1990  # 잔여 10 토큰만 남김
    long_text = "word " * 100
    truncated = bc.truncate_to_budget("leader", long_text)
    assert count_tokens(truncated) <= 10


def test_total_budget_matches_sas():
    """핵심 검증: MAS 4 Agent 합산 예산 = SAS 예산 (8000)"""
    bc = BudgetController(mode="mas")
    total_mas = sum(bc.budgets.values())
    assert total_mas == 8000


def test_token_counter():
    """tiktoken 토큰 카운터 기본 동작 검증"""
    assert count_tokens("hello") > 0
    assert count_tokens("") == 0
    assert count_tokens("hello world") > count_tokens("hello")  # 긴 텍스트 = 더 많은 토큰
