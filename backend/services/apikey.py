# apikey.py - HELIX 발급 API 키 관리 (기획서 15.3 / Phase 5)
# 평문 키는 생성 시 1회만 노출, DB에는 sha256 해시만 저장

import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import ApiKey, User


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def create_key(session: AsyncSession, user_id: str, name: str) -> dict:
    """새 키 발급 - 평문 key는 이 반환값에서만 볼 수 있음"""
    raw = "sk-helix-" + secrets.token_urlsafe(24)
    prefix = f"{raw[:13]}…{raw[-4:]}"  # 마스킹 표시용
    key = ApiKey(
        user_id=user_id, provider="helix",
        name=name or "기본 키", prefix=prefix, encrypted_key=_hash(raw),
    )
    session.add(key)
    await session.commit()
    await session.refresh(key)
    return {"id": key.id, "name": key.name, "prefix": key.prefix, "created_at": key.created_at.isoformat(), "key": raw}


async def list_keys(session: AsyncSession, user_id: str) -> list[dict]:
    """사용자의 키 목록 (마스킹된 prefix만)"""
    result = await session.execute(
        select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
    )
    return [
        {
            "id": k.id, "name": k.name, "prefix": k.prefix,
            "created_at": k.created_at.isoformat(),
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        }
        for k in result.scalars().all()
    ]


async def revoke_key(session: AsyncSession, user_id: str, key_id: str) -> None:
    """키 폐기 (소유자 검증 포함)"""
    await session.execute(delete(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id))
    await session.commit()


async def verify_key(session: AsyncSession, raw: str) -> User | None:
    """평문 키를 해시로 조회해 소유 사용자를 반환하고 last_used_at 갱신. 실패 시 None"""
    result = await session.execute(select(ApiKey).where(ApiKey.encrypted_key == _hash(raw)))
    key = result.scalar_one_or_none()
    if key is None:
        return None
    key.last_used_at = datetime.now(timezone.utc)
    user = await session.get(User, key.user_id)
    await session.commit()
    return user
