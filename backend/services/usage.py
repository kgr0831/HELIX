# usage.py - 사용량 추적 (기획서 15.3 / Phase 5)
# 질문(합의 호출)마다 일자별 호출 수/토큰 수를 누적

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import Usage


async def increment_usage(session: AsyncSession, user_id: str, tokens: int, calls: int = 1) -> None:
    """오늘자 사용량 행을 upsert하여 누적"""
    today = date.today()
    result = await session.execute(
        select(Usage).where(Usage.user_id == user_id, Usage.date == today)
    )
    row = result.scalar_one_or_none()
    if row is None:
        session.add(Usage(user_id=user_id, date=today, total_tokens=tokens, total_calls=calls))
    else:
        row.total_tokens += tokens
        row.total_calls += calls
    await session.commit()


async def get_usage(session: AsyncSession, user_id: str) -> dict:
    """사용자의 누적 사용량 합계"""
    result = await session.execute(select(Usage).where(Usage.user_id == user_id))
    rows = result.scalars().all()
    return {
        "total_calls": sum(r.total_calls for r in rows),
        "total_tokens": sum(r.total_tokens for r in rows),
    }
