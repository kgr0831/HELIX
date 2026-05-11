// Chat thread — user message → glass box → final answer
const { useState, useEffect, useRef } = React;

const renderInline = (text) => {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith("`") && p.endsWith("`")
    ? <code key={i}>{p.slice(1, -1)}</code>
    : <React.Fragment key={i}>{p}</React.Fragment>);
};

const Turn = ({ turn, liveCharCount }) => {
  const a = AGENTS[turn.agent];
  const fullText = turn.text;
  const visible = liveCharCount !== undefined ? fullText.slice(0, liveCharCount) : fullText;
  const isStreaming = liveCharCount !== undefined && liveCharCount < fullText.length;
  return (
    <div className="turn">
      <div className="turn-rail">
        <AgentAvatar id={turn.agent} />
      </div>
      <div className="turn-body">
        <div className="turn-head">
          <span className="turn-agent">{a.name}</span>
          <span className="turn-model mono">{a.model}</span>
          {turn.role === "lead" && <span className="turn-role lead">리더</span>}
          {turn.role === "dissent" && <span className="turn-role dissent">이견</span>}
          {turn.role === "agree" && <span className="turn-role agree">동의</span>}
          <span className="turn-time mono">{turn.time}</span>
        </div>
        <div className="turn-text">
          {renderInline(visible)}
          {isStreaming && <span className="caret" />}
        </div>
      </div>
    </div>
  );
};

const GlassBox = ({ turns, expanded, onToggle, live, liveIdx, liveChar }) => {
  const rounds = {};
  turns.forEach(t => { (rounds[t.round] ||= []).push(t); });
  const roundIds = Object.keys(rounds).sort();
  const visibleCount = live ? Math.min(liveIdx + 1, turns.length) : turns.length;

  return (
    <div className="glassbox">
      <div className={`gb-head ${expanded ? "expanded" : ""}`} onClick={onToggle}>
        <div className="gb-title"><Icon.Atom /> Glass Box</div>
        {live ? (
          <span className="gb-status live"><span className="pulse" />Live · {visibleCount}/{turns.length}</span>
        ) : (
          <span className="gb-status"><Icon.Check />합의 도달</span>
        )}
        <div className="gb-stats">
          <span><strong>{turns.length}</strong> turns</span>
          <span><strong>1,428</strong> tok</span>
          <span><strong>5.12</strong>s</span>
        </div>
        <div className="gb-chevron"><Icon.Chevron /></div>
      </div>
      {expanded && (
        <div className="gb-body">
          {roundIds.map(rid => {
            const items = rounds[rid];
            const labelTurn = items.find(t => t.label);
            const anyVisible = items.some(t => turns.indexOf(t) < visibleCount);
            if (!anyVisible) return null;
            return (
              <div key={rid} className="gb-round">
                <div className="gb-round-label">
                  <span>Round {rid}</span>
                  {labelTurn && <span style={{ color: "var(--fg-dim)", textTransform: "none", letterSpacing: 0 }}>· {labelTurn.label}</span>}
                </div>
                {items.map((t, i) => {
                  const globalIdx = turns.indexOf(t);
                  if (globalIdx >= visibleCount) return null;
                  const isLive = live && globalIdx === liveIdx;
                  return <Turn key={i} turn={t} liveCharCount={isLive ? liveChar : undefined} />;
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FinalAnswer = ({ leader }) => {
  const a = AGENTS[leader];
  return (
    <div className="final">
      <div className="final-head">
        <span className="lead-avatar" style={{ background: a.bg, color: a.fg }}>{a.glyph}</span>
        <div className="meta">
          <span className="title">합성된 답변</span>
          <span className="sub mono">조율: {a.name} · {a.model}</span>
        </div>
        <span className="consensus"><Icon.Check />Consensus 94%</span>
      </div>
      <div className="final-text">
        <p>분석 완료. 세 에이전트(Flash · DeepSeek · o3)의 검토를 합쳐 최종 수정안을 적용했습니다.</p>
        <p><strong>{renderInline("`GetUserAsync()`")}</strong> 메서드에 다음 변경이 적용되었습니다:</p>
        <p>· {renderInline("`SqlException` try-catch 블록 추가")}<br/>
        · {renderInline("최대 3회 지수 백오프(`2^n × 100ms`) 재시도 로직")}<br/>
        · {renderInline("`CancellationToken` 인자 지원으로 무한 대기 방지")}<br/>
        · {renderInline("`using` 블록으로 `SqlConnection` 리소스 누수 차단")}</p>
        <p>우측 코드 에디터에서 변경 사항을 확인하고 <strong>수락</strong> 또는 <strong>거절</strong>해 주세요.</p>
      </div>
      <div className="final-foot">
        <div className="agents-used">
          <span>참여 모델</span>
          <span className="stack">
            {["sonnet","flash","deepseek","o1"].map(id => {
              const ag = AGENTS[id];
              return <span key={id} style={{ background: ag.bg, color: ag.fg }}>{ag.glyph}</span>;
            })}
          </span>
        </div>
        <div className="actions">
          <button className="icon-btn" title="복사"><Icon.Copy /></button>
          <button className="icon-btn" title="다시 토론"><Icon.Refresh /></button>
          <button className="icon-btn" title="좋아요"><Icon.Up /></button>
          <button className="icon-btn" title="싫어요"><Icon.Down /></button>
        </div>
      </div>
    </div>
  );
};

const Thread = ({ live, expandedDefault }) => {
  const [expanded, setExpanded] = useState(expandedDefault ?? true);
  const [liveIdx, setLiveIdx] = useState(live ? 0 : TURNS.length);
  const [liveChar, setLiveChar] = useState(0);

  useEffect(() => { setLiveIdx(live ? 0 : TURNS.length); setLiveChar(0); }, [live]);

  useEffect(() => {
    if (!live) return;
    if (liveIdx >= TURNS.length) {
      const id = setTimeout(() => { setLiveIdx(0); setLiveChar(0); }, 5000);
      return () => clearTimeout(id);
    }
    const t = TURNS[liveIdx];
    if (liveChar < t.text.length) {
      const id = setTimeout(() => setLiveChar(c => Math.min(t.text.length, c + Math.max(3, Math.floor(t.text.length / 50)))), 22);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => { setLiveIdx(i => i + 1); setLiveChar(0); }, 320);
      return () => clearTimeout(id);
    }
  }, [live, liveIdx, liveChar]);

  const isLiveActive = live && liveIdx < TURNS.length;
  const showFinal = !live || liveIdx >= TURNS.length;

  return (
    <div className="thread">
      <div className="thread-inner">
        <div className="msg-user">
          <div className="you-tag mono">You · 방금</div>
          <div className="msg-user-bubble">{QUESTION}</div>
        </div>

        <GlassBox
          turns={TURNS}
          expanded={expanded}
          onToggle={() => setExpanded(e => !e)}
          live={isLiveActive}
          liveIdx={liveIdx}
          liveChar={liveChar}
        />

        {showFinal && <FinalAnswer leader="sonnet" />}
      </div>
    </div>
  );
};

const Composer = () => {
  const [val, setVal] = useState("");
  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          placeholder="질문을 입력하세요. HELIX가 여러 모델을 호출해 토론하고 합성합니다…"
          value={val}
          onChange={e => setVal(e.target.value)}
          rows={1}
        />
        <div className="composer-row">
          <span className="composer-chip"><Icon.Atom /> 5 agents · Sonnet lead</span>
          <span className="composer-chip"><Icon.Attach /> 첨부</span>
          <span className="composer-chip">/ commands</span>
          <button className="composer-send" disabled={!val.trim()}><Icon.Send /></button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Thread, Composer });
