"""C2: SAS Baseline — Gemini 3 Flash (Gateway)
상용 API 단일 모델 비교 대상
기획서 5.2: Researcher와 동일 모델을 단일로 사용했을 때의 성능"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.agents.base import BaseAgent
from backend.utils.budget_controller import SAS_BUDGET
from experiments.eval.metrics import evaluate_batch


# C2 전용 Agent - Gemini 3 Flash 단일 모델
class SASC2Agent(BaseAgent):
    """SAS C2 Agent - Gemini 3 Flash를 단일 모델로 사용"""
    def __init__(self):
        super().__init__(
            name="SAS-Gemini-3-Flash",
            role="sas",
            model_name="gemini-3-flash-preview",  # Gateway의 Google 모델
            system_prompt=(
                "You are a multi-hop question answering system. "
                "Answer the question step by step and provide a short final answer."
            ),
        )


async def run_sas_c2(dataset_path: str, max_samples: int = 50):
    """C2 실험 실행 - Gemini 3 Flash 단일 모델로 MuSiQue 질문에 답변"""
    agent = SASC2Agent()

    # MuSiQue 데이터셋 로드
    with open(dataset_path) as f:
        samples = [json.loads(line) for line in f][:max_samples]

    predictions = []
    ground_truths = []
    total_tokens = 0
    total_latency = 0

    for i, sample in enumerate(samples):
        question = sample["question"]
        answer = sample["answer"]

        prompt = f"Question: {question}\n\nProvide a concise answer."
        response = await agent.generate(prompt, max_tokens=SAS_BUDGET)

        predictions.append(response.content)
        ground_truths.append(answer)
        total_tokens += response.token_count
        total_latency += response.latency_ms

        print(f"[{i+1}/{len(samples)}] tokens={response.token_count}")

    metrics = evaluate_batch(predictions, ground_truths)
    result = {
        "cell": "C2",
        "system": "SAS: Gemini 3 Flash (Gateway)",
        "exact_match": metrics["exact_match"],
        "f1": metrics["f1"],
        "avg_tokens": total_tokens / len(samples),
        "avg_latency_ms": total_latency / len(samples),
        "count": len(samples),
    }

    # 결과를 JSON으로 저장
    output_path = Path(__file__).resolve().parents[1] / "results" / "C2_sas_gemini.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nC2 Results: EM={result['exact_match']:.3f}, F1={result['f1']:.3f}")
    return result


if __name__ == "__main__":
    dataset = sys.argv[1] if len(sys.argv) > 1 else "experiments/datasets/musique/data/musique_ans_v1.0_dev.jsonl"
    asyncio.run(run_sas_c2(dataset))
