// Agent registry — colors, glyphs, vendors
const AGENTS = {
  sonnet:  { name: "Sonnet",  model: "claude-sonnet-4.5",  vendor: "Anthropic", glyph: "S",  bg: "oklch(0.72 0.14 35 / 0.18)",  fg: "oklch(0.82 0.16 35)" },
  opus:    { name: "Opus",    model: "claude-opus-4.1",    vendor: "Anthropic", glyph: "O",  bg: "oklch(0.72 0.14 25 / 0.18)",  fg: "oklch(0.78 0.18 25)" },
  haiku:   { name: "Haiku",   model: "claude-haiku-4.5",   vendor: "Anthropic", glyph: "H",  bg: "oklch(0.72 0.14 50 / 0.18)",  fg: "oklch(0.85 0.16 60)" },
  gpt:     { name: "GPT-5",   model: "openai/gpt-5",       vendor: "OpenAI",    glyph: "G",  bg: "oklch(0.7 0.13 165 / 0.18)",  fg: "oklch(0.82 0.16 165)" },
  o1:      { name: "o3",      model: "openai/o3",          vendor: "OpenAI",    glyph: "o",  bg: "oklch(0.7 0.13 195 / 0.18)",  fg: "oklch(0.82 0.15 195)" },
  gemini:  { name: "Gemini",  model: "gemini-2.5-pro",     vendor: "Google",    glyph: "✦",  bg: "oklch(0.7 0.14 250 / 0.18)",  fg: "oklch(0.82 0.16 250)" },
  flash:   { name: "Flash",   model: "gemini-2.5-flash",   vendor: "Google",    glyph: "F",  bg: "oklch(0.78 0.14 90 / 0.18)",  fg: "oklch(0.88 0.18 95)"  },
  deepseek:{ name: "DeepSeek",model: "deepseek-r1",        vendor: "DeepSeek",  glyph: "D",  bg: "oklch(0.7 0.14 280 / 0.18)",  fg: "oklch(0.82 0.18 280)" },
  grok:    { name: "Grok",    model: "grok-4",             vendor: "xAI",       glyph: "X",  bg: "oklch(0.65 0.02 260 / 0.4)",  fg: "oklch(0.95 0.005 260)" },
  sonar:   { name: "Sonar",   model: "sonar-reasoning-pro",vendor: "Perplexity",glyph: "P",  bg: "oklch(0.72 0.14 200 / 0.18)", fg: "oklch(0.82 0.15 200)" },
};

const AgentAvatar = ({ id, size = 22 }) => {
  const a = AGENTS[id];
  if (!a) return null;
  return (
    <span className="turn-avatar" style={{ background: a.bg, color: a.fg, width: size, height: size, fontSize: size * 0.46 }}>
      {a.glyph}
    </span>
  );
};

Object.assign(window, { AGENTS, AgentAvatar });
