"""C3: SAS Baseline — GPT-5.4-mini (Gateway)
Leader와 동급 모델을 단일로 사용했을 때의 비교 대상
기획서 5.2: 자원 매칭된 단일 모델 비교"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.agents.base import BaseAgent
from backend.utils.budget_controller import SAS_BUDGET
from experiments.eval.metrics import evaluate_batch


# C3 전용 Agent - Leader와 동일 모델 (GPT-5.4-mini)
class SASC3Agent(BaseAgent):
    """SAS C3 Agent - GPT-5.4-mini를 단일 모델로 사용 (Leader와 동급)"""
    def __init__(self):
        super().__init__(
            name="SAS-GPT-5.4-mini",
            role="sas",
            model_name="gpt-5.4-mini",  # Leader Agent와 동일 모델
            system_prompt=(
                "You are a multi-hop question answering system. "
                "Answer the question step by step and provide a short final answer."
            ),
        )


async def run_sas_c3(dataset_path: str, max_samples: int = 50):
    """C3 실험 실행 - GPT-5.4-mini 단일 모델로 MuSiQue 질문에 답변"""
    agent = SASC3Agent()

    with open(dataset_path) as f:
        samples = [json.loads(line) for line in f][:max_samples]

    predictions = []
    ground_truths = []
    total_tokens = 0
    total_latency = 0

    for i, sample in enumerate(samples):
        question = sample["question"]
        answer = sample["answer"]

        # 단일 모델에게 전체 8000 token budget 할당
        prompt = f"Question: {question}\n\nProvide a concise answer."
        response = await agent.generate(prompt, max_tokens=SAS_BUDGET)

        predictions.append(response.content)
        ground_truths.append(answer)
        total_tokens += response.token_count
        total_latency += response.latency_ms

        print(f"[{i+1}/{len(samples)}] tokens={response.token_count}")

    metrics = evaluate_batch(predictions, ground_truths)
    result = {
        "cell": "C3",
        "system": "SAS: GPT-5.4-mini (Gateway)",
        "exact_match": metrics["exact_match"],
        "f1": metrics["f1"],
        "avg_tokens": total_tokens / len(samples),
        "avg_latency_ms": total_latency / len(samples),
        "count": len(samples),
    }

    output_path = Path(__file__).resolve().parents[1] / "results" / "C3_sas_gpt54mini.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nC3 Results: EM={result['exact_match']:.3f}, F1={result['f1']:.3f}")
    return result


if __name__ == "__main__":
    dataset = sys.argv[1] if len(sys.argv) > 1 else "experiments/datasets/musique/data/musique_ans_v1.0_dev.jsonl"
    asyncio.run(run_sas_c3(dataset))
