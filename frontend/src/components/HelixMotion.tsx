import React from "react";

/**
 * HelixMotion - HELIX 브랜딩을 위한 프리미엄 모션 그래픽 SVG
 * 
 * 디자인 컨셉:
 * 1. "Cross-Check": 두 개의 이중나선이 교차하며 중앙에서 X 형태를 형성
 * 2. "Data Flow": 나선 경로를 따라 움직이는 데이터 파티클 (Thinking Tokens)
 * 3. "Glass Box": 반투명한 레이어와 글로우 효과를 통한 미래지향적 무드
 */

export const HelixMotion: React.FC<{ size?: number }> = ({ size = 400 }) => {
  return (
    <div className="helix-motion-container" style={{ width: size, height: size, position: 'relative' }}>
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="helix-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="helix-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--fg-muted)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--fg-muted)" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 배경 그리드 (Subtle) */}
        <g opacity="0.1">
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="var(--fg-faint)" strokeWidth="0.5" />
              <line x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="var(--fg-faint)" strokeWidth="0.5" />
            </React.Fragment>
          ))}
        </g>

        {/* 메인 나선 A (Accent) */}
        <path
          d="M 100 50 C 100 150, 300 150, 300 200 C 300 250, 100 250, 100 350"
          stroke="url(#helix-grad-1)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className="helix-path helix-path-1"
        />

        {/* 메인 나선 B (Muted) */}
        <path
          d="M 300 50 C 300 150, 100 150, 100 200 C 100 250, 300 250, 300 350"
          stroke="url(#helix-grad-2)"
          strokeWidth="3"
          strokeLinecap="round"
          className="helix-path helix-path-2"
        />

        {/* 데이터 노드 및 연결선 (중앙 X 영역) */}
        <g className="data-nodes">
          <circle cx="200" cy="200" r="4" fill="var(--accent)" filter="url(#glow)">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* 가로 연결선들 */}
          {[100, 150, 250, 300].map((y, i) => (
            <line
              key={i}
              x1={y < 200 ? (y === 100 ? 120 : 170) : (y === 250 ? 170 : 120)}
              y1={y}
              x2={y < 200 ? (y === 100 ? 280 : 230) : (y === 250 ? 230 : 280)}
              y2={y}
              stroke="var(--fg-faint)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          ))}
        </g>

        {/* 흐르는 파티클 (Thinking Tokens) */}
        <circle r="2" fill="var(--accent)">
          <animateMotion
            path="M 100 50 C 100 150, 300 150, 300 200 C 300 250, 100 250, 100 350"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="2" fill="var(--fg-muted)">
          <animateMotion
            path="M 300 50 C 300 150, 100 150, 100 200 C 100 250, 300 250, 300 350"
            dur="4s"
            begin="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <style>{`
        .helix-motion-container {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        .helix-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 3s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};
