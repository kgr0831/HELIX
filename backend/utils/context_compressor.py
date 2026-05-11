# context_compressor.py - 토론 로그 압축 유틸리티
# 토론이 장기화될 때 불필요한 미사여구를 제거하여 토큰 비용 폭발 방지
# 기획서 9.3 리스크 대응: 합의 종료 + 최대 라운드 제한 + Context 압축

import re

from backend.utils.token_counter import count_tokens


def compress_discussion_log(log_entries: list[dict], max_tokens: int = 1500) -> str:
    """토론 로그에서 핵심 결론만 추출하여 압축된 문자열로 반환"""
    if not log_entries:
        return ""

    # 각 Agent의 발언에서 핵심 포인트만 추출
    compressed_parts = []
    for entry in log_entries:
        agent = entry.get("agent_name", "Unknown")
        content = entry.get("content", "")
        summary = _extract_key_points(content)
        compressed_parts.append(f"[{agent}]: {summary}")

    result = "\n".join(compressed_parts)

    # max_tokens 초과 시 잘라냄 (컨텍스트 윈도우 보호)
    if count_tokens(result) > max_tokens:
        result = _truncate_to_tokens(result, max_tokens)

    return result


def _extract_key_points(text: str) -> str:
    """규칙 기반 핵심 포인트 추출: 불필요한 문장을 필터링"""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    key_sentences = []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        # 미사여구 패턴에 해당하면 제거
        if _is_filler(s):
            continue
        key_sentences.append(s)
    # 핵심 문장이 없으면 원문 앞부분 200자를 반환
    return " ".join(key_sentences) if key_sentences else text[:200]


def _is_filler(sentence: str) -> bool:
    """미사여구 패턴 매칭 - 정보 가치가 낮은 문장 감지"""
    filler_patterns = [
        r"^(well|so|okay|alright|let me|i think that|basically|essentially)\b",
        r"^(as (i|we) (mentioned|discussed|noted))",
        r"^(in (other words|summary|conclusion))",
    ]
    lower = sentence.lower()
    return any(re.match(p, lower) for p in filler_patterns)


def _truncate_to_tokens(text: str, max_tokens: int) -> str:
    """텍스트를 지정된 토큰 수 이내로 잘라서 반환"""
    import tiktoken
    encoder = tiktoken.get_encoding("cl100k_base")
    encoded = encoder.encode(text)[:max_tokens]
    return encoder.decode(encoded)
