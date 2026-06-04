# database.py - async SQLAlchemy 엔진 / 세션 (기획서 15.3)
# PostgreSQL + asyncpg 비동기 연결을 관리

import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://helix:helix@localhost:5432/helix",
)

# async 엔진 - 앱 전역에서 1개만 사용
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# 세션 팩토리 - 요청마다 세션을 발급
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """모든 ORM 모델의 베이스"""


async def get_session() -> AsyncSession:
    """FastAPI 의존성 주입용 세션 제너레이터"""
    async with async_session() as session:
        yield session
