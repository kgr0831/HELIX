// App shell
const { useState: useS, useEffect: useE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#a3e635",
  "density": "comfortable",
  "glassDefault": true,
  "liveStreaming": true,
  "showSubBadge": true
}/*EDITMODE-END*/;

const ACCENT_HEX_TO_OKLCH = {
  "#a3e635": { dark: "oklch(0.88 0.21 130)", light: "oklch(0.65 0.2 135)" },
  "#67e8f9": { dark: "oklch(0.86 0.13 210)", light: "oklch(0.6 0.16 215)" },
  "#c4b5fd": { dark: "oklch(0.8 0.14 290)", light: "oklch(0.58 0.2 290)" },
  "#fbbf24": { dark: "oklch(0.85 0.16 75)", light: "oklch(0.7 0.18 65)" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeId, setActiveId] = useS("c1");
  const [sbCollapsed, setSbCollapsed] = useS(false);

  useE(() => {
    const a = ACCENT_HEX_TO_OKLCH[t.accent] || ACCENT_HEX_TO_OKLCH["#a3e635"];
    const v = a[t.theme] || a.dark;
    document.documentElement.style.setProperty("--accent", v);
    document.documentElement.style.setProperty("--accent-dim", `color-mix(in oklch, ${v} 18%, transparent)`);
    document.documentElement.style.setProperty("--accent-line", `color-mix(in oklch, ${v} 35%, transparent)`);
  }, [t.accent, t.theme]);

  return (
    <div className="app" data-theme={t.theme} data-density={t.density} data-sidebar={sbCollapsed ? "collapsed" : "open"}>
      <header className="topbar">
        <div className="brand">
          <HelixWordmark size={20} showSub={t.showSubBadge} />
        </div>
        <button className="tb-btn" onClick={() => setSbCollapsed(c => !c)} title="사이드바 토글"><Icon.Sidebar /></button>
        <button className="tb-btn"><Icon.Search /> 검색 <span className="mono" style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>⌘K</span></button>

        <span className="tb-grow" />

        <span className="tb-pill">
          <span className="dot" />
          <span>Lead</span>
          <strong>Sonnet 4.5</strong>
          <Icon.Chevron />
        </span>
        <span className="tb-pill">
          <span>Mode</span>
          <strong>Debate · 3 rounds</strong>
          <Icon.Chevron />
        </span>
        <button className="tb-btn primary"><Icon.Plus />새 토론</button>
      </header>

      <Sidebar activeId={activeId} onSelect={setActiveId} />

      <main className="main">
        <Thread live={t.liveStreaming} expandedDefault={t.glassDefault} key={`${t.liveStreaming}-${activeId}`} />
        <Composer />
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="외관" />
        <TweakRadio label="테마" value={t.theme} options={[{value: "dark", label: "Dark"}, {value: "light", label: "Light"}]} onChange={v => setTweak("theme", v)} />
        <TweakColor label="액센트" value={t.accent} options={["#a3e635", "#67e8f9", "#c4b5fd", "#fbbf24"]} onChange={v => setTweak("accent", v)} />
        <TweakRadio label="밀도" value={t.density} options={[{value: "comfortable", label: "기본"}, {value: "compact", label: "컴팩트"}]} onChange={v => setTweak("density", v)} />

        <TweakSection label="토론 동작" />
        <TweakToggle label="라이브 스트리밍" value={t.liveStreaming} onChange={v => setTweak("liveStreaming", v)} />
        <TweakToggle label="Glass Box 기본 펼침" value={t.glassDefault} onChange={v => setTweak("glassDefault", v)} />
        <TweakToggle label="브랜드 배지 표시" value={t.showSubBadge} onChange={v => setTweak("showSubBadge", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
