// Logo.tsx - HELIX DNA 이중나선 로고 및 워드마크
// 두 개의 나선이 교차하며 X 형태를 구성
// 브랜드 아이덴티티: HELIX (Heterogeneous LLM Integrated eXchange)

interface HelixMarkProps {
  size?: number;
  stroke?: number;
  accent?: string;
  muted?: string;
}

export const HelixMark = ({ size = 24, stroke = 1.6, accent = "currentColor", muted = "var(--fg-muted)" }: HelixMarkProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HELIX">
    <path d="M 5 3 C 5 8, 19 8, 19 12 C 19 16, 5 16, 5 21" stroke={accent} strokeWidth={stroke} strokeLinecap="round" />
    <path d="M 19 3 C 19 8, 5 8, 5 12 C 5 16, 19 16, 19 21" stroke={muted} strokeWidth={stroke} strokeLinecap="round" />
    <line x1="5" y1="6.5" x2="19" y2="6.5" stroke={muted} strokeWidth={stroke * 0.5} strokeLinecap="round" opacity="0.45" />
    <line x1="11" y1="12" x2="13" y2="12" stroke={accent} strokeWidth={stroke * 1.4} strokeLinecap="round" />
    <line x1="5" y1="17.5" x2="19" y2="17.5" stroke={muted} strokeWidth={stroke * 0.5} strokeLinecap="round" opacity="0.45" />
  </svg>
);

interface HelixWordmarkProps {
  size?: number;
  showSub?: boolean;
}

export const HelixWordmark = ({ size = 22, showSub = true }: HelixWordmarkProps) => (
  <>
    <HelixMark size={size} accent="var(--accent)" muted="var(--fg-muted)" />
    <span className="brand-wordmark">HEL<span style={{ color: "var(--accent)" }}>I</span>X</span>
    {showSub && <span className="brand-sub mono">eXchange</span>}
  </>
);
