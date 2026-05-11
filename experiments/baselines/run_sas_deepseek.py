"""C1: SAS Baseline — GPT-5.4 (Gateway)
하이엔드 단일 모델 SAS 비교 대상
기획서 5.2: 가장 강력한 단일 모델과의 정면 비교"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.agents.base import BaseAgent
from backend.utils.budget_controller import SAS_BUDGET
from experiments.eval.metrics import evaluate_batch


# C1 전용 Agent - 하이엔드 단일 모델 (GPT-5.4)
class SASC1Agent(BaseAgent):
    """SAS C1 Agent - GPT-5.4를 단일 모델로 사용"""
    def __init__(self):
        super().__init__(
            name="SAS-GPT-5.4",
            role="sas",
            model_name="gpt-5.4",  # Gateway의 하이엔드 OpenAI 모델
            system_prompt=(
                "You are a multi-hop question answering system. "
                "Answer the question step by step and provide a short final answer."
            ),
        )


async def run_sas_c1(dataset_path: str, max_samples: int = 50):
    """C1 실험 실행 - GPT-5.4 단일 모델로 MuSiQue 질문에 답변"""
    agent = SASC1Agent()

    # MuSiQue 데이터셋 로드 (JSONL 형식)
    with open(dataset_path) as f:
        samples = [json.loads(line) for line in f][:max_samples]

    predictions = []
    ground_truths = []
    total_tokens = 0
    total_latency = 0

    for i, sample in enumerate(samples):
        question = sample["question"]
        answer = sample["answer"]

        # 단일 모델에게 전체 SAS_BUDGET(8000 tokens) 할당
        prompt = f"Question: {question}\n\nProvide a concise answer."
        response = await agent.generate(prompt, max_tokens=SAS_BUDGET)

        predictions.append(response.content)
        ground_truths.append(answer)
        total_tokens += response.token_count
        total_latency += response.latency_ms

        print(f"[{i+1}/{len(samples)}] tokens={response.token_count}")

    # EM, F1 메트릭 계산
    metrics = evaluate_batch(predictions, ground_truths)
    result = {
        "cell": "C1",
        "system": "SAS: GPT-5.4 (Gateway)",
        "exact_match": metrics["exact_match"],
        "f1": metrics["f1"],
        "avg_tokens": total_tokens / len(samples),
        "avg_latency_ms": total_latency / len(samples),
        "count": len(samples),
    }

    # 결과 JSON 저장
    output_path = Path(__file__).resolve().parents[1] / "results" / "C1_sas_gpt54.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nC1 Results: EM={result['exact_match']:.3f}, F1={result['f1']:.3f}")
    return result


if __name__ == "__main__":
    dataset = sys.argv[1] if len(sys.argv) > 1 else "experiments/datasets/musique/data/musique_ans_v1.0_dev.jsonl"
    asyncio.run(run_sas_c1(dataset))
