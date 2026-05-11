// agents.ts - HELIX 에이전트 레지스트리
// 4개 에이전트의 색상, 글리프, 벤더 정보를 정의
// GlassBox UI에서 에이전트별 시각적 구분에 사용

export interface AgentInfo {
  name: string;
  model: string;
  vendor: string;
  glyph: string;
  bg: string;
  fg: string;
}

// 실제 HELIX 시스템의 4개 에이전트 + 디자인용 확장 에이전트
export const AGENTS: Record<string, AgentInfo> = {
  gpt:      { name: "GPT-5.4",   model: "gpt-5.4-mini",           vendor: "OpenAI",     glyph: "G",  bg: "oklch(0.7 0.13 165 / 0.18)",  fg: "oklch(0.82 0.16 165)" },
  flash:    { name: "Flash",     model: "gemini-3-flash-preview",  vendor: "Google",     glyph: "F",  bg: "oklch(0.78 0.14 90 / 0.18)",  fg: "oklch(0.88 0.18 95)"  },
  sonar:    { name: "Sonar",     model: "sonar-reasoning-pro",     vendor: "Perplexity", glyph: "P",  bg: "oklch(0.72 0.14 200 / 0.18)", fg: "oklch(0.82 0.15 200)" },
  grok:     { name: "Grok",      model: "grok-3-mini",            vendor: "xAI",        glyph: "X",  bg: "oklch(0.65 0.02 260 / 0.4)",  fg: "oklch(0.95 0.005 260)" },
};

// 백엔드 agent_name/role → 에이전트 ID 매핑
export function resolveAgentId(agentName: string, role: string): string {
  const lower = agentName.toLowerCase();
  if (lower.includes("leader") || role === "leader") return "gpt";
  if (lower.includes("researcher")) return "flash";
  if (lower.includes("logician")) return "sonar";
  if (lower.includes("critic")) return "grok";
  return "gpt";
}
