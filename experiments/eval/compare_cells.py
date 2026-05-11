# compare_cells.py - 실험 셀(C1~C5) 결과 비교 스크립트
# 각 실험 조건의 EM, F1, 토큰 사용량, 지연시간을 비교 분석
# 사용법: python -m experiments.eval.compare_cells [results_dir]

import json
import sys
from pathlib import Path

import pandas as pd


def load_results(results_dir: Path) -> pd.DataFrame:
    """results 디렉토리에서 모든 JSON 결과 파일을 읽어 DataFrame으로 변환"""
    rows = []
    for f in results_dir.glob("*.json"):
        with open(f) as fh:
            data = json.load(fh)
        # 각 실험 셀의 메트릭을 하나의 행으로 수집
        rows.append({
            "cell": data.get("cell", f.stem),
            "system": data.get("system", ""),
            "exact_match": data.get("exact_match", 0),
            "f1": data.get("f1", 0),
            "avg_tokens": data.get("avg_tokens", 0),
            "avg_latency_ms": data.get("avg_latency_ms", 0),
            "sample_count": data.get("count", 0),
        })
    # 셀 번호 기준 정렬 (C1 → C2 → ... → C5)
    return pd.DataFrame(rows).sort_values("cell")


def compare(results_dir: str = "experiments/results") -> None:
    """C1~C5 실험 결과를 로드하고 비교 테이블을 출력"""
    df = load_results(Path(results_dir))
    if df.empty:
        print("No results found.")
        return

    # 전체 비교 테이블 출력
    print("\n=== Cross-Check AI: Cell Comparison ===\n")
    print(df.to_string(index=False))

    # 최고 성능 셀 식별
    print("\n--- Summary ---")
    best_em = df.loc[df["exact_match"].idxmax()]
    best_f1 = df.loc[df["f1"].idxmax()]
    print(f"Best EM:  {best_em['cell']} ({best_em['exact_match']:.3f})")
    print(f"Best F1:  {best_f1['cell']} ({best_f1['f1']:.3f})")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "experiments/results"
    compare(path)
