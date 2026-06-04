# settings.py - 사용자 설정 영구화 (기획서 15.3 / Phase 5)
# 테마 + 응답 기본값(언어/어조/라운드/에이전트 풀)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import Setting

# 응답 기본값의 기본 프리셋
DEFAULTS = {"language": "ko", "tone": "balanced", "rounds": "2", "agentPool": "auto"}


async def get_settings(session: AsyncSession, user_id: str) -> dict:
    """저장된 설정 반환 (없으면 기본값)"""
    result = await session.execute(select(Setting).where(Setting.user_id == user_id))
    row = result.scalar_one_or_none()
    if row is None:
        return {"theme": "dark", "defaults": dict(DEFAULTS)}
    return {"theme": row.theme, "defaults": {**DEFAULTS, **(row.defaults or {})}}


async def update_settings(session: AsyncSession, user_id: str, theme: str | None, defaults: dict | None) -> dict:
    """설정 upsert"""
    result = await session.execute(select(Setting).where(Setting.user_id == user_id))
    row = result.scalar_one_or_none()
    if row is None:
        row = Setting(user_id=user_id, theme=theme or "dark", defaults=defaults or dict(DEFAULTS))
        session.add(row)
    else:
        if theme is not None:
            row.theme = theme
        if defaults is not None:
            row.defaults = {**DEFAULTS, **defaults}
    await session.commit()
    return await get_settings(session, user_id)
