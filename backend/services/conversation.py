# conversation.py - 대화 영구화 CRUD (기획서 15.3 / Phase 3)
# conversations / messages / agent_events 저장 및 조회

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.db.models import AgentEvent, Conversation, Message


async def create_conversation(session: AsyncSession, user_id: str, title: str) -> Conversation:
    """새 대화 세션 생성"""
    conv = Conversation(user_id=user_id, title=title)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return conv


async def save_message(
    session: AsyncSession,
    conversation_id: str,
    question: str,
    final_answer: str,
    consensus: bool,
    token_usage: dict,
    latency_ms: float,
    events: list[dict],
) -> Message:
    """질문/최종답변 + 토론 로그(agent_events)를 저장"""
    msg = Message(
        conversation_id=conversation_id,
        question=question,
        final_answer=final_answer,
        consensus=consensus,
        token_usage=token_usage,
        latency_ms=latency_ms,
    )
    session.add(msg)
    await session.flush()  # msg.id 확보
    for e in events:
        session.add(AgentEvent(
            message_id=msg.id,
            round_number=e["round_number"],
            agent_name=e["agent_name"],
            role=e["role"],
            content=e["content"],
        ))
    await session.commit()
    await session.refresh(msg)
    return msg


async def list_conversations(session: AsyncSession, user_id: str) -> list[Conversation]:
    """사용자의 대화 목록 (최신순)"""
    result = await session.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
    )
    return list(result.scalars().all())


async def rename_conversation(session: AsyncSession, conversation_id: str, user_id: str, title: str) -> bool:
    """대화 제목 변경 (소유자 검증). 성공 시 True"""
    result = await session.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        return False
    conv.title = title
    await session.commit()
    return True


async def delete_conversation(session: AsyncSession, conversation_id: str, user_id: str) -> None:
    """대화 삭제 (소유자 검증, messages/agent_events는 cascade)"""
    await session.execute(
        delete(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
    )
    await session.commit()


async def delete_all_conversations(session: AsyncSession, user_id: str) -> None:
    """사용자의 모든 대화 삭제 (히스토리 전체 삭제)"""
    await session.execute(delete(Conversation).where(Conversation.user_id == user_id))
    await session.commit()


async def get_conversation(session: AsyncSession, conversation_id: str, user_id: str) -> Conversation | None:
    """대화 상세 (messages + agent_events 즉시 로드, 소유자 검증)"""
    result = await session.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .options(selectinload(Conversation.messages).selectinload(Message.events))
    )
    return result.scalar_one_or_none()
