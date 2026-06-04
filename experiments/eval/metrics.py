# metrics.py - MuSiQue 평가 메트릭 (Exact Match, F1 Score)
# MuSiQue 데이터셋의 표준 평가 방식을 구현
# 참고: Trivedi et al. (2022) TACL 논문의 평가 프로토콜

import re
import string
from collections import Counter


def normalize_answer(text: str) -> str:
    """답변 텍스트를 정규화 - 소문자 변환, 관사 제거, 구두점 제거, 공백 정리 - 전처리 안하고 비교하면 틀린 걸로 나와서 필수임"""
    text = text.lower()
    text = re.sub(r"\b(a|an|the)\b", " ", text)  # 영어 관사 제거 - 관사는 의미 없으니까 날려버리기
    text = "".join(ch for ch in text if ch not in string.punctuation)  # 구두점 제거
    text = " ".join(text.split())  # 연속 공백 정리
    return text


def exact_match(prediction: str, ground_truth: str) -> float:
    """Exact Match - 정규화된 예측과 정답이 정확히 일치하면 1.0, 아니면 0.0 - 하나라도 틀리면 바로 0점! 냉정한 EM"""
    return float(normalize_answer(prediction) == normalize_answer(ground_truth))


def f1_score(prediction: str, ground_truth: str) -> float:
    """Token-level F1 Score - 예측과 정답의 토큰 겹침 비율로 계산"""
    pred_tokens = normalize_answer(prediction).split()
    truth_tokens = normalize_answer(ground_truth).split()

    # 빈 토큰 처리 - 가끔 모델이 대답 안할 때(빈 문자열) 대비해서 예외처리
    if not pred_tokens or not truth_tokens:
        return float(pred_tokens == truth_tokens)

    # 공통 토큰 수 계산 (Counter 교집합)
    common = Counter(pred_tokens) & Counter(truth_tokens)
    num_common = sum(common.values())

    if num_common == 0:
        return 0.0

    # Precision = 공통 / 예측, Recall = 공통 / 정답
    precision = num_common / len(pred_tokens)
    recall = num_common / len(truth_tokens)
    # F1 = 2 * P * R / (P + R) - 산술평균 아니고 조화평균임. F1 공식 오랜만에 보네
    return 2 * precision * recall / (precision + recall)


def evaluate_batch(predictions: list[str], ground_truths: list[str]) -> dict:
    """배치 평가 - 여러 샘플의 EM과 F1 평균을 계산하여 반환"""
    ems = [exact_match(p, g) for p, g in zip(predictions, ground_truths)]
    f1s = [f1_score(p, g) for p, g in zip(predictions, ground_truths)]
    return {
        "exact_match": sum(ems) / len(ems),
        "f1": sum(f1s) / len(f1s),
        "count": len(ems),
    }
