
import asyncio
from backend.graph.builder import build_graph

async def test_graph():
    graph = build_graph()
    initial_state = {"question": "OS의 대표적인 기능 두가지를 소개해주세요."}
    
    print("--- STARTING GRAPH ---")
    async for output in graph.astream(initial_state, stream_mode="updates"):
        for node_name, node_output in output.items():
            print(f"\n[NODE: {node_name}]")
            if "round_number" in node_output:
                print(f"  Round Number: {node_output['round_number']}")
            if "consensus" in node_output:
                print(f"  Consensus: {node_output['consensus']}")
            if "discussion_log" in node_output:
                print(f"  Log entry count: {len(node_output['discussion_log'])}")
    print("\n--- GRAPH FINISHED ---")

if __name__ == "__main__":
    asyncio.run(test_graph())
