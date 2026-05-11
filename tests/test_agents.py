# test_agents.py - Agent 레이어 테스트
# 단위 테스트: AgentResponse 모델 검증 (외부 API 불필요)
# 통합 테스트: 실제 Gateway API 호출 (pytest -m integration)

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.agents.base import AgentResponse


def test_agent_response_model():
    """AgentResponse Pydantic 모델이 올바르게 생성되는지 검증"""
    resp = AgentResponse(
        agent_name="TestAgent",
        role="test",
        content="Hello",
        token_count=5,
        latency_ms=100.0,
    )
    # 모든 필드가 정확히 설정되었는지 확인
    assert resp.agent_name == "TestAgent"
    assert resp.token_count == 5


@pytest.mark.integration
@pytest.mark.asyncio
async def test_leader_agent():
    """Leader Agent (GPT-5.4-mini) 실제 API 호출 테스트"""
    from backend.agents.leader import LeaderAgent
    agent = LeaderAgent()
    response = await agent.generate("Say hello.", max_tokens=50)
    assert response.content       # 응답 내용이 비어있지 않은지
    assert response.token_count > 0  # 토큰 수가 양수인지
    assert response.latency_ms > 0   # 지연시간이 측정되었는지


@pytest.mark.integration
@pytest.mark.asyncio
async def test_researcher_agent():
    """Researcher Agent (Gemini 3 Flash) 실제 API 호출 테스트"""
    from backend.agents.researcher import ResearcherAgent
    agent = ResearcherAgent()
    response = await agent.generate("Say hello.", max_tokens=50)
    assert response.content
    assert response.token_count > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_logician_agent():
    """Logician Agent (Sonar Reasoning Pro) 실제 API 호출 테스트"""
    from backend.agents.logician import LogicianAgent
    agent = LogicianAgent()
    response = await agent.generate("Say hello.", max_tokens=50)
    assert response.content
    assert response.token_count > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_critic_agent():
    """Critic Agent (Grok 3 Mini) 실제 API 호출 테스트"""
    from backend.agents.critic import CriticAgent
    agent = CriticAgent()
    response = await agent.generate("Say hello.", max_tokens=50)
    assert response.content
    assert response.token_count > 0
