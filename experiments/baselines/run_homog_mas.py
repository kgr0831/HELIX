"""C4: Homogeneous MAS — GPT-5.4-mini x 4 (Tran & Kiela 재현)
동종 MAS 비교 대상 - 동일 모델 4개로 구성된 MAS
기획서 5.2: Tran & Kiela(2026)의 동종 MAS 실험을 재현"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.agents.base import BaseAgent
from backend.utils.budget_controller import BudgetController
from experiments.eval.metrics import evaluate_batch


# C4 전용 Agent - GPT-5.4-mini 4개 (동종 구성)
class HomogAgent(BaseAgent):
    """동종 MAS용 Agent - 모두 동일한 GPT-5.4-mini 모델 사용"""
    def __init__(self, name: str, role: str, system_prompt: str):
        super().__init__(
            name=name, role=role,
            model_name="gpt-5.4-mini",  # 4개 모두 동일 모델
            system_prompt=system_prompt,
        )


async def run_homog_mas(dataset_path: str, max_samples: int = 50):
    """C4 실험 실행 - 동종 MAS(GPT-5.4-mini x 4)로 MuSiQue 질문에 답변"""
    # 4개의 동일 모델 Agent 생성 (역할만 다름)
    agents = {
        "leader": HomogAgent("Leader", "leader", "You coordinate and synthesize responses."),
        "agent_2": HomogAgent("Agent-2", "researcher", "You extract and verify relevant facts."),
        "agent_3": HomogAgent("Agent-3", "logician", "You verify logical consistency."),
        "agent_4": HomogAgent("Agent-4", "critic", "You find edge cases and errors."),
    }

    with open(dataset_path) as f:
        samples = [json.loads(line) for line in f][:max_samples]

    predictions = []
    ground_truths = []
    total_tokens = 0
    total_latency = 0

    for i, sample in enumerate(samples):
        question = sample["question"]
        answer = sample["answer"]

        # 3개 Agent 병렬 호출 (각 2000 tokens)
        parallel_results = await asyncio.gather(
            agents["agent_2"].generate(f"Question: {question}\n\nExtract relevant facts.", max_tokens=2000),
            agents["agent_3"].generate(f"Question: {question}\n\nVerify logical steps.", max_tokens=2000),
            agents["agent_4"].generate(f"Question: {question}\n\nFind edge cases.", max_tokens=2000),
        )

        # Leader가 3개 응답을 통합 (2000 tokens)
        summary = "\n".join(f"[{r.agent_name}]: {r.content}" for r in parallel_results)
        synthesis = await agents["leader"].generate(
            f"Question: {question}\n\nAgent responses:\n{summary}\n\nSynthesize a final answer.",
            max_tokens=2000,
        )

        # 총 토큰 = 4 agent 합산, 지연시간 = 병렬 최대값 + Leader
        sample_tokens = sum(r.token_count for r in parallel_results) + synthesis.token_count
        sample_latency = max(r.latency_ms for r in parallel_results) + synthesis.latency_ms

        predictions.append(synthesis.content)
        ground_truths.append(answer)
        total_tokens += sample_tokens
        total_latency += sample_latency

        print(f"[{i+1}/{len(samples)}] tokens={sample_tokens}")

    metrics = evaluate_batch(predictions, ground_truths)
    result = {
        "cell": "C4",
        "system": "Homogeneous MAS: GPT-5.4-mini x 4",
        "exact_match": metrics["exact_match"],
        "f1": metrics["f1"],
        "avg_tokens": total_tokens / len(samples),
        "avg_latency_ms": total_latency / len(samples),
        "count": len(samples),
    }

    output_path = Path(__file__).resolve().parents[1] / "results" / "C4_homog_mas.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nC4 Results: EM={result['exact_match']:.3f}, F1={result['f1']:.3f}")
    return result


if __name__ == "__main__":
    dataset = sys.argv[1] if len(sys.argv) > 1 else "experiments/datasets/musique/data/musique_ans_v1.0_dev.jsonl"
    asyncio.run(run_homog_mas(dataset))
