# cache.py - 답변 캐싱 (기획서 15.4 / Phase 4)
# Gateway에 embeddings가 없어 fastembed(로컬 ONNX)로 질문을 임베딩하고,
# pgvector 코사인 최근접 검색으로 유사 질문의 캐시된 답변을 재사용한다.
# 주의: 이 모듈은 서비스 경로(stream_helix)에서만 호출된다. experiments/는 graph를
#       직접 호출하므로 캐시를 자동으로 우회한다(연구 측정 무결성 유지).

import os

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import AnswerCache

load_dotenv()

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
SIMILARITY_THRESHOLD = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.9"))
# 메모리 적은 무료 호스트에서는 CACHE_ENABLED=false로 임베딩 모델 로딩 자체를 끔
ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"

# fastembed 모델은 무겁게 1회만 로드 (지연 초기화)
_model = None


def _get_model():
    global _model
    if _model is None:
        from fastembed import TextEmbedding
        _model = TextEmbedding(model_name=EMBEDDING_MODEL)
    return _model


def embed(text: str) -> list[float]:
    """질문 텍스트를 임베딩 벡터로 변환"""
    vec = next(iter(_get_model().embed([text])))
    return vec.tolist()


async def find_similar(session: AsyncSession, embedding: list[float]) -> dict | None:
    """코사인 최근접 캐시를 찾아 임계값을 넘으면 반환(hit_count 증가). 없으면 None"""
    dist_col = AnswerCache.question_embedding.cosine_distance(embedding).label("dist")
    result = await session.execute(
        select(AnswerCache, dist_col).order_by(dist_col).limit(1)
    )
    row = result.first()
    if row is None:
        return None
    cache, dist = row
    similarity = 1.0 - float(dist)
    if similarity < SIMILARITY_THRESHOLD:
        return None
    cache.hit_count += 1
    await session.commit()
    return {
        "final_answer": cache.final_answer,
        "consensus": cache.consensus,
        "agent_events": cache.agent_events or [],
        "similarity": similarity,
    }


async def store(
    session: AsyncSession,
    question: str,
    embedding: list[float],
    final_answer: str,
    consensus: bool,
    agent_events: list[dict],
) -> None:
    """새 질문-답변을 캐시에 저장 (MISS 시)"""
    session.add(AnswerCache(
        question=question,
        question_embedding=embedding,
        final_answer=final_answer,
        consensus=consensus,
        agent_events=agent_events,
    ))
    await session.commit()
