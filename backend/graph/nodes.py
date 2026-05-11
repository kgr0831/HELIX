# nodes.py - LangGraph 노드 함수 정의
# 각 노드는 토론의 한 단계를 담당 (계획 → 병렬 토론 → 통합 → 최종 답변)

import asyncio
import re

from backend.agents.leader import LeaderAgent
from backend.agents.researcher import ResearcherAgent
from backend.agents.logician import LogicianAgent
from backend.agents.critic import CriticAgent
from backend.graph.state import CrossCheckState
from backend.utils.budget_controller import BudgetController
from backend.utils.context_compressor import compress_discussion_log

# 4개 Agent 인스턴스 생성 (이기종: OpenAI / Google / Perplexity / xAI)
leader = LeaderAgent()
researcher = ResearcherAgent()
logician = LogicianAgent()
critic = CriticAgent()


async def leader_plan_node(state: CrossCheckState) -> dict:
    """Leader가 Multi-hop 질문을 분석하고 3개 Agent에게 작업을 분배"""
    question = state["question"]
    budget_ctrl = BudgetController(mode="mas")
    remaining = budget_ctrl.budgets["leader"]  # Leader에게 할당된 토큰 예산

    # Leader에게 작업 분배를 요청하는 프롬프트
    prompt = (
        f"질문: {question}\n\n"
        f"이 질문을 분석하고 Researcher, Logician, Critic에게 역할을 배분하세요.\n"
        f"2~4문장으로 짧게 작성하세요. 예: '이 질문은 ~를 확인해야 합니다. Researcher에게 ~를, Logician에게 ~를 맡기겠습니다.'"
    )

    response = await leader.generate(prompt, max_tokens=remaining)
    # 상태 업데이트: 계획, 라운드 번호, 토큰 사용량 초기화
    return {
        "leader_plan": response.content,
        "round_number": 1,
        "max_rounds": 5,
        "token_usage": {"leader": response.token_count},
        "discussion_log": [{
            "round_number": 0,
            "agent_name": "Leader",
            "role": "leader",
            "content": response.content,
        }],
    }


async def researcher_node(state: CrossCheckState) -> dict:
    """사실 검증 담당 Researcher 호출"""
    return await _call_specific_agent(state, researcher, "위 질문에 대해 핵심 사실을 확인하세요. 2~4문장으로 짧게 답변하세요.")

async def logician_node(state: CrossCheckState) -> dict:
    """논리 검증 담당 Logician 호출"""
    return await _call_specific_agent(state, logician, "위 추론의 논리적 타당성을 검증하세요. 2~4문장으로 짧게 답변하세요.")

async def critic_node(state: CrossCheckState) -> dict:
    """비판 담당 Critic 호출"""
    return await _call_specific_agent(state, critic, "위 논의에서 약점이나 간과된 부분을 지적하세요. 2~4문장으로 짧게 답변하세요.")

async def _call_specific_agent(state: CrossCheckState, agent, role_instruction: str) -> dict:
    """공통 에이전트 호출 로직"""
    plan = state["leader_plan"]
    question = state["question"]
    round_num = state["round_number"]
    token_usage = dict(state.get("token_usage", {}))

    context = ""
    if state.get("discussion_log"):
        context = compress_discussion_log(state["discussion_log"])

    prompt = f"질문: {question}\n\n리더의 계획: {plan}\n"
    if context:
        prompt += f"\n이전 토론 요약:\n{context}\n"
    prompt += f"\n{role_instruction}"

    budget = BudgetController(mode="mas")
    budget.usage = dict(token_usage)
    remaining = budget.remaining(agent.role)

    if remaining <= 0:
        return {}

    resp = await agent.generate(prompt, max_tokens=remaining)
    
    agent_responses = {
        agent.role: {
            "agent_name": resp.agent_name,
            "role": resp.role,
            "content": resp.content,
            "token_count": resp.token_count,
            "latency_ms": resp.latency_ms,
        }
    }
    
    new_entry = {
        "round_number": round_num,
        "agent_name": resp.agent_name,
        "role": resp.role,
        "content": resp.content,
    }

    return {
        "agent_responses": agent_responses,
        "discussion_log": [new_entry],
        "token_usage": {agent.role: token_usage.get(agent.role, 0) + resp.token_count},
        "round_number": round_num,
    }


async def leader_synthesize_node(state: CrossCheckState) -> dict:
    """Leader가 3개 Agent의 응답을 통합하고 합의 여부를 판단"""
    question = state["question"]
    responses = state["agent_responses"]
    token_usage = dict(state.get("token_usage", {}))
    round_num = state["round_number"]

    budget = BudgetController(mode="mas")
    budget.usage = dict(token_usage)
    remaining = budget.remaining("leader")  # Leader의 잔여 토큰 예산

    # 3개 Agent의 응답을 하나의 요약으로 결합
    summary_parts = []
    for role, resp in responses.items():
        summary_parts.append(f"[{resp['agent_name']}]: {resp['content']}")
    summary = "\n\n".join(summary_parts)

    # 합의 판단 + 최종 답변 생성 프롬프트
    prompt = (
        f"당신은 {len(responses)}명의 에이전트 토론을 조율하는 오케스트레이터 리더입니다.\n\n"
        f"질문: {question}\n\n"
        f"에이전트 응답:\n{summary}\n\n"
        f"당신의 임무:\n"
        f"1. 모든 에이전트의 의견이 일치하는지(Consensus) 엄격히 판단하세요.\n"
        f"2. 만약 조금이라도 논리적 허점, 역할에 대한 불만, 계획 수정을 요구하는 내용이 있다면 반드시 추가 토론(consensus: false)을 결정하세요.\n"
        f"3. 에이전트가 자신의 역할 정의가 잘못되었다고 하거나, 다른 에이전트의 역할을 조정해야 한다고 하는 것도 '합의 미달'입니다.\n"
        f"4. 합의가 되었다면 최종 답변을, 아니면 현재까지의 쟁점을 요약하여 답변하세요.\n\n"
        f"반드시 아래 JSON 형식으로만 답변하세요:\n"
        f"{{\"consensus\": true/false, \"reasoning\": \"합의/미합의 근거\", \"answer\": \"종합 답변 또는 불일치 요약\"}}"
    )

    response = await leader.generate(prompt, max_tokens=remaining)
    token_usage["leader"] = token_usage.get("leader", 0) + response.token_count

    import json
    try:
        # JSON 블록 추출 시도
        json_match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            consensus = data.get("consensus", False)
            ans_content = data.get("answer", response.content)
        else:
            # 폴백: 텍스트 기반 판정
            content_upper = response.content.upper().replace(" ", "")
            consensus = "CONSENSUS:YES" in content_upper and "CONSENSUS:NO" not in content_upper
            ans_content = response.content
    except Exception:
        consensus = False
        ans_content = response.content

    new_entry = {
        "round_number": round_num,
        "agent_name": "Leader",
        "role": "leader",
        "content": ans_content,
    }

    return {
        "consensus": consensus,
        "token_usage": token_usage,
        "discussion_log": [new_entry],
        "round_number": round_num + 1,  # 다음 라운드로 증가
    }


async def final_answer_node(state: CrossCheckState) -> dict:
    """토론 종료 후 최종 답변을 추출하여 반환"""
    log = state.get("discussion_log", [])
    if log:
        # Leader의 마지막 발언에서 "ANSWER:" 이후 부분을 추출
        last_leader = [e for e in log if e["role"] == "leader"]
        if last_leader:
            answer = last_leader[-1]["content"].strip()
        else:
            answer = "No answer generated."
    else:
        answer = "No discussion occurred."

    return {
        "final_answer": answer,
        "consensus": state.get("consensus", False),
    }
