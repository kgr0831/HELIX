# database.py - async SQLAlchemy 엔진 / 세션 (기획서 15.3)
# PostgreSQL + asyncpg 비동기 연결을 관리

import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

_RAW_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://helix:helix@localhost:5432/helix",
)


def _normalize_db_url(raw: str) -> tuple[str, dict]:
    """관리형 Postgres(Neon/Supabase 등)의 표준 URL을 asyncpg용으로 정규화.
    - postgresql:// → postgresql+asyncpg://
    - asyncpg가 모르는 쿼리(sslmode/channel_binding)는 제거하고 ssl은 connect_args로 전달
    """
    if raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(raw)
    query = dict(parse_qsl(parts.query))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)  # asyncpg 미지원 파라미터 제거
    connect_args: dict = {}
    if sslmode and sslmode != "disable":
        connect_args["ssl"] = True  # 관리형 DB는 SSL 필요
    normalized = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    return normalized, connect_args


DATABASE_URL, _connect_args = _normalize_db_url(_RAW_URL)

# async 엔진 - 앱 전역에서 1개만 사용 (관리형 DB의 유휴 끊김 대비 pre_ping/recycle)
engine = create_async_engine(
    DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=300,
    connect_args=_connect_args,
)

# 세션 팩토리 - 요청마다 세션을 발급
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """모든 ORM 모델의 베이스"""


async def get_session() -> AsyncSession:
    """FastAPI 의존성 주입용 세션 제너레이터"""
    async with async_session() as session:
        yield session
