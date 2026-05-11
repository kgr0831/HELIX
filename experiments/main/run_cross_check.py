"""C5: Heterogeneous MAS — Cross-Check AI (메인 실험)
이기종 LLM 기반 MAS - 본 연구의 핵심 실험 셀
4개의 서로 다른 provider 모델(OpenAI/Google/Perplexity/xAI)로 구성"""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.graph.builder import build_graph
from experiments.eval.metrics import evaluate_batch


async def run_cross_check(dataset_path: str, max_samples: int = 50):
    """C5 실험 실행 - Cross-Check AI(이기종 MAS)로 MuSiQue 질문에 답변"""
    # LangGraph 기반 4-Agent 토론 그래프 빌드
    graph = build_graph()

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

        start = time.perf_counter()  # wall-clock 시간 측정 시작

        # LangGraph 그래프 실행 - 4-Agent 토론 전체 흐름
        result = await graph.ainvoke({
            "question": question,
            "leader_plan": "",
            "agent_responses": {},
            "discussion_log": [],
            "consensus": False,
            "round_number": 0,
            "max_rounds": 3,  # 최대 3라운드 토론
            "final_answer": "",
            "token_usage": {},
        })

        latency = (time.perf_counter() - start) * 1000
        # 전체 Agent의 토큰 사용량 합산
        tokens = sum(result.get("token_usage", {}).values())

        predictions.append(result.get("final_answer", ""))
        ground_truths.append(answer)
        total_tokens += tokens
        total_latency += latency

        print(f"[{i+1}/{len(samples)}] tokens={tokens}, consensus={result.get('consensus')}")

    # 배치 평가 - EM, F1 계산
    metrics = evaluate_batch(predictions, ground_truths)
    output = {
        "cell": "C5",
        "system": "Heterogeneous MAS: Cross-Check AI",
        "exact_match": metrics["exact_match"],
        "f1": metrics["f1"],
        "avg_tokens": total_tokens / len(samples),
        "avg_latency_ms": total_latency / len(samples),
        "count": len(samples),
    }

    # 결과 JSON 저장
    output_path = Path(__file__).resolve().parents[1] / "results" / "C5_cross_check.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nC5 Results: EM={output['exact_match']:.3f}, F1={output['f1']:.3f}")
    return output


if __name__ == "__main__":
    dataset = sys.argv[1] if len(sys.argv) > 1 else "experiments/datasets/musique/data/musique_ans_v1.0_dev.jsonl"
    asyncio.run(run_cross_check(dataset))
