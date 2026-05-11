# test_metrics.py - MuSiQue 평가 메트릭 단위 테스트
# Exact Match와 F1 Score가 정확히 계산되는지 검증
# MuSiQue 표준 평가 방식 (Trivedi et al., 2022) 준수

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from experiments.eval.metrics import exact_match, f1_score, normalize_answer


def test_normalize_answer():
    """답변 정규화 - 관사 제거, 소문자 변환, 공백 정리"""
    assert normalize_answer("The Dark Knight") == "dark knight"
    assert normalize_answer("  hello   world  ") == "hello world"


def test_exact_match():
    """Exact Match - 정규화 후 완전 일치 여부 확인"""
    assert exact_match("The Dark Knight", "the dark knight") == 1.0  # 대소문자 무시
    assert exact_match("Batman", "The Dark Knight") == 0.0            # 불일치


def test_f1_score():
    """F1 Score - 토큰 겹침 비율 기반 부분 일치 점수"""
    assert f1_score("dark knight", "dark knight") == 1.0    # 완전 일치 = 1.0
    assert f1_score("completely wrong", "dark knight") == 0.0  # 겹침 없음 = 0.0
    # 부분 일치: "dark knight rises"와 "dark knight" → 0 < F1 < 1
    f1 = f1_score("the dark knight rises", "dark knight")
    assert 0 < f1 < 1
