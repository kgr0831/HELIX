# models.py - SQLAlchemy ORM 모델 (기획서 15.3 스키마)
# users / conversations / messages / agent_events / api_keys / usage / settings / answer_cache

import os
import uuid
from datetime import date, datetime

from dotenv import load_dotenv
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.database import Base

load_dotenv()

# 임베딩 차원 - 캐싱에 쓰는 모델에 맞춰 .env에서 설정 (기획서 15.4)
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1536"))


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    """계정 - Google 프로필 기반 (기획서 15.2)"""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(200))
    picture: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(32), default="google")
    provider_user_id: Mapped[str] = mapped_column(String(128), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    """대화 세션"""
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """질문/최종답변 1쌍"""
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    final_answer: Mapped[str | None] = mapped_column(Text)
    consensus: Mapped[bool] = mapped_column(Boolean, default=False)
    token_usage: Mapped[dict | None] = mapped_column(JSON)
    latency_ms: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    events: Mapped[list["AgentEvent"]] = relationship(back_populates="message", cascade="all, delete-orphan")


class AgentEvent(Base):
    """토론 로그(discussion_log) 영구화"""
    __tablename__ = "agent_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id", ondelete="CASCADE"), index=True)
    round_number: Mapped[int] = mapped_column(Integer)
    agent_name: Mapped[str] = mapped_column(String(64))
    role: Mapped[str] = mapped_column(String(64))
    content: Mapped[str] = mapped_column(Text)

    message: Mapped["Message"] = relationship(back_populates="events")


class ApiKey(Base):
    """사용자별 API 키 (암호화 저장)"""
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(64), default="helix")
    name: Mapped[str] = mapped_column(String(100), default="기본 키")  # 사용자 지정 라벨
    prefix: Mapped[str] = mapped_column(String(64), default="")        # 마스킹 표시용 (예: sk-helix-7f3a…b0c1)
    encrypted_key: Mapped[str] = mapped_column(Text, index=True)       # 평문 키의 sha256 해시 (원문은 생성 시 1회만 노출)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # 마지막 사용 시각


class Usage(Base):
    """사용량 추적 (일자별)"""
    __tablename__ = "usage"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_calls: Mapped[int] = mapped_column(Integer, default=0)


class Setting(Base):
    """사용자 설정"""
    __tablename__ = "settings"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme: Mapped[str] = mapped_column(String(32), default="dark")
    defaults: Mapped[dict | None] = mapped_column(JSON)


class AnswerCache(Base):
    """답변 캐시 - 임베딩 유사도 기반 (기획서 15.4)"""
    __tablename__ = "answer_cache"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    question: Mapped[str] = mapped_column(Text)
    question_embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    final_answer: Mapped[str] = mapped_column(Text)
    consensus: Mapped[bool] = mapped_column(Boolean, default=False)
    agent_events: Mapped[list | None] = mapped_column(JSON)
    hit_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
