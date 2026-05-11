# token_counter.py - tiktoken 기반 토큰 카운팅 유틸리티
# Tran & Kiela 논문 방법론 준수: API 제공 토큰 수를 신뢰하지 않고 직접 측정
# cl100k_base 인코딩은 GPT-4 계열과 호환되는 범용 토큰화 방식

import tiktoken

# 인코더를 모듈 레벨에서 1회만 초기화 (성능 최적화)
_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """텍스트의 토큰 수를 tiktoken으로 직접 측정하여 반환"""
    return len(_encoder.encode(text))
