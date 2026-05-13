# 🧬 HELIX - HEterogeneous Llm Integrated eXchange

<p align="center">
  <img src="./Design/exports/helix-mark.png" width="200" />
</p>

## What is HELIX?

HELIX is a collaborative intelligence platform designed to find the truth through AI-driven debate. Instead of relying on a single AI's perspective, HELIX orchestrates a panel of diverse digital agents to challenge, verify, and refine every idea until a solid consensus is reached.

## Why HELIX?

In an era of AI hallucinations and one-sided perspectives, HELIX provides complete transparency for collective reasoning. It doesn't just give you an answer; it reveals the critical discussion and thought process behind it. By pitting different perspectives against each other, HELIX filters out bias and uncovers logical gaps that a single model might miss.

## Architecture

```
Frontend (React + Vite)          Backend (FastAPI + LangGraph)
┌─────────────────────┐          ┌──────────────────────────┐
│  Chat UI (Glass Box) │◄──SSE──►│  LangGraph Orchestrator  │
│  Sidebar             │         │  Token Budget Controller  │
│  Composer            │         │  Context Compressor       │
└─────────────────────┘          └─────┬──┬──┬──┬───────────┘
                                       │  │  │  │
                              ┌────────┘  │  │  └────────┐
                              ▼           ▼  ▼           ▼
                           Leader    Researcher Logician  Critic
                          GPT-5.4    Gemini 3   Sonar    Grok 3
                          (OpenAI)   (Google)  (Perplx)  (xAI)
```

### 4-Agent Heterogeneous MAS

| Role | Model | Vendor | Strength |
|------|-------|--------|----------|
| **Leader** | gpt-5.4-mini | OpenAI | Orchestration, synthesis |
| **Researcher** | gemini-3-flash-preview | Google | Fact extraction, context |
| **Logician** | sonar-reasoning-pro | Perplexity | Logical verification |
| **Critic** | grok-3-mini | xAI | Critical analysis, edge cases |

### Debate Flow

1. **Leader** analyzes the question and dispatches tasks
2. **3 agents** respond in parallel (Researcher, Logician, Critic)
3. **Leader** synthesizes responses and checks consensus
4. If no consensus → re-discuss (max 4 rounds)
5. If still no consensus after 4 rounds → Leader force-synthesizes final answer

## Key Features

- **Collaborative Debate**: Specialized agents work together to analyze questions from multiple angles.
- **Transparent Reasoning**: Watch the entire process unfold in real-time via the Glass Box UI.
- **Dynamic Consensus**: The system keeps discussing until agents reach meaningful agreement on core facts.
- **Forced Synthesis**: Even without full consensus, the Leader produces a refined answer from all discussion.
- **Token Budget Control**: Fair comparison between MAS and SAS via equal token budgets (Tran & Kiela methodology).

## Tech Stack

**Backend**: Python 3.11+, FastAPI, LangGraph, LangChain, tiktoken, SSE-Starlette
**Frontend**: React 19, TypeScript, Vite, Zustand, react-markdown
**LLM Gateway**: OpenAI-compatible API (multi-provider routing)

## Quick Start

```bash
# Backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Set .env
# GATEWAY_API_KEY=...
# GATEWAY_BASE_URL=...

uvicorn backend.main:app --reload --port 8000

# Frontend (another terminal)
cd frontend
npm install && npm run dev

# Open http://localhost:5173
```

## Design Pages — Implementation Roadmap

Design 폴더에 아래 페이지들의 디자인이 준비되어 있으며, 순차적으로 React 컴포넌트로 구축 예정입니다.

| Page | Design | Status | Description |
|------|--------|--------|-------------|
| **Chat** | `Design/chat.jsx` | ✅ Implemented | 4-Agent 토론 + Glass Box UI |
| **Landing** | `Design/Landing/` | 🔲 Planned | 서비스 소개 랜딩 페이지 |
| **Login** | `Design/Login/` | 🔲 Planned | 인증/로그인 페이지 |
| **Pricing** | `Design/Pricing/` | 🔲 Planned | 요금제 페이지 |
| **Settings - Account** | `Design/Settings-Account/` | 🔲 Planned | 계정 설정 페이지 |
| **Settings - API** | `Design/Settings-API/` | 🔲 Planned | API 키 관리 페이지 |

---
© 2026 HELIX Project.
