# nodes.py - LangGraph 노드 함수 정의
# 각 노드는 토론의 한 단계를 담당 (계획 → 병렬 토론 → 통합 → 최종 답변)

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
        exhausted_content = "[토큰 예산 소진으로 응답을 생성하지 못했습니다]"
        return {
            "agent_responses": {
                agent.role: {
                    "agent_name": agent.name,
                    "role": agent.role,
                    "content": exhausted_content,
                    "token_count": 0,
                    "latency_ms": 0,
                }
            },
            "discussion_log": [{
                "round_number": round_num,
                "agent_name": agent.name,
                "role": agent.role,
                "content": exhausted_content,
            }],
        }

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
        f"[합의(Consensus) 판단 기준]\n"
        f"아래 조건을 모두 충족하면 consensus: true입니다:\n"
        f"- 핵심 사실(팩트)에 대해 에이전트들이 서로 모순되지 않음\n"
        f"- 사용자 질문에 대한 답변의 방향이 일치함\n\n"
        f"아래는 consensus: false가 아닙니다 (무시하세요):\n"
        f"- 역할 분담/프로세스에 대한 의견 (메타적 비판)\n"
        f"- 추가 정보가 있으면 좋겠다는 제안\n"
        f"- 모호성 지적이지만 맥락상 명확한 경우 (예: '뉴욕'은 보통 뉴욕시)\n"
        f"- 표현 방식이나 상세 수준에 대한 선호 차이\n\n"
        f"합의가 되었다면 에이전트들의 정보를 종합하여 사용자 질문에 대한 최종 답변을 작성하세요.\n"
        f"합의가 안 되었다면 어떤 핵심 사실이 서로 모순되는지 구체적으로 설명하세요.\n\n"
        f"반드시 아래 JSON 형식으로만 답변하세요:\n"
        f"{{\"consensus\": true/false, \"reasoning\": \"판단 근거\", \"answer\": \"종합 답변 또는 모순 요약\"}}"
    )

    response = await leader.generate(prompt, max_tokens=remaining)
    leader_total = token_usage.get("leader", 0) + response.token_count

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
        "token_usage": {"leader": leader_total},
        "discussion_log": [new_entry],
        "round_number": round_num + 1,  # 다음 라운드로 증가
    }


async def final_answer_node(state: CrossCheckState) -> dict:
    """토론 종료 후 최종 답변을 생성하여 반환.
    합의 도달: 마지막 Leader 합성 답변을 사용.
    합의 미달: Leader가 전체 토론을 종합하여 강제 최종 답변 생성."""
    consensus = state.get("consensus", False)
    log = state.get("discussion_log", [])

    if consensus:
        last_leader = [e for e in log if e["role"] == "leader"]
        answer = last_leader[-1]["content"].strip() if last_leader else "No answer generated."
    else:
        from backend.utils.context_compressor import compress_discussion_log
        discussion_summary = compress_discussion_log(log, max_tokens=2000)
        question = state["question"]

        prompt = (
            f"당신은 토론 조율 리더입니다. 에이전트들이 여러 라운드 토론했지만 완전한 합의에 도달하지 못했습니다.\n"
            f"하지만 토론에서 수집된 정보를 종합하여 사용자에게 최선의 답변을 제공해야 합니다.\n\n"
            f"질문: {question}\n\n"
            f"토론 내용:\n{discussion_summary}\n\n"
            f"위 토론에서 확인된 사실과 합의된 부분을 중심으로, "
            f"사용자 질문에 대한 최종 답변을 직접 작성하세요.\n"
            f"답변만 작성하세요. '합의가 안 됐다'는 언급은 하지 마세요."
        )

        response = await leader.generate(prompt, max_tokens=1000)
        answer = response.content

    return {
        "final_answer": answer,
        "consensus": consensus,
        "token_usage": state.get("token_usage", {}),
    }
