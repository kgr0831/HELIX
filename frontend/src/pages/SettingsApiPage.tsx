import s from "./SettingsApiPage.module.css";

const KEYS = [
  { name: "Production", mask: "sk-helix-prod-****…****a3f2", created: "2026.03.18", lastUsed: "2분 전" },
  { name: "Development", mask: "sk-helix-dev-****…****71b0", created: "2026.04.25", lastUsed: "3일 전" },
];

const ENDPOINTS = [
  { method: "POST", path: "/v1/consensus", desc: "다중 모델 합의 호출" },
  { method: "GET", path: "/v1/models", desc: "사용 가능한 모델 목록" },
  { method: "GET", path: "/v1/usage", desc: "현재 월 사용량 조회" },
  { method: "POST", path: "/v1/consensus/stream", desc: "스트리밍 합의 호출 (SSE)" },
];

export function SettingsApiPage() {
  return (
    <>
      <div className={s.pageHead}>
        <h1>API 키</h1>
        <p>API 키와 사용량을 관리합니다.</p>
      </div>

      {/* ── API Keys ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>API 키</h2>
            <p className={s.cbSub}>프로그래밍 방식으로 HELIX 합의 엔진에 접근합니다.</p>
          </div>
          <div className={s.headActions}>
            <button className={s.createBtn}>+ 새 키 생성</button>
          </div>
        </div>
        <div className={s.cbBody}>
          {KEYS.map((k) => (
            <div key={k.name} className={s.keyRow}>
              <div>
                <div className={s.keyName}>{k.name}</div>
                <div className={s.keyMask}>{k.mask}</div>
                <div className={s.keyMeta}>생성: {k.created} · 마지막 사용: {k.lastUsed}</div>
              </div>
              <div className={s.keyActions}>
                <button className={s.keyBtn}>복사</button>
                <button className={s.keyBtn}>표시</button>
                <button className={s.keyBtnDanger}>폐기</button>
              </div>
            </div>
          ))}
        </div>
        <div className={s.cbFoot}>
          <span>키는 생성 시 한 번만 표시됩니다. 안전하게 보관하세요.</span>
        </div>
      </section>

      {/* ── Usage ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>이번 달 사용량</h2>
            <p className={s.cbSub}>2026년 5월 결제 주기 (5/1 ~ 5/31)</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: "42%" }} />
          </div>
          <div className={s.progressLabel}>
            <span>2,520 / 5,000 호출 사용</span>
            <span>42%</span>
          </div>
          <div className={s.usageGrid}>
            <div className={s.usageStat}>
              <div className="val"><span>2,520</span></div>
              <div className="lbl">API 호출</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">2,480</div>
              <div className="lbl">남은 호출</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">Team</div>
              <div className="lbl">현재 플랜</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">5/31</div>
              <div className="lbl">결제일</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Endpoints ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>엔드포인트 레퍼런스</h2>
            <p className={s.cbSub}>Base URL: https://api.helix.ai</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <table className={s.endpointTable}>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep) => (
                <tr key={ep.path}>
                  <td><span className={ep.method === "POST" ? s.methodPost : s.methodGet}>{ep.method}</span></td>
                  <td className={s.endpointPath}>{ep.path}</td>
                  <td className={s.endpointDesc}>{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Quick start ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>퀵 스타트</h2>
            <p className={s.cbSub}>아래 코드를 복사해 바로 시작하세요.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.codeBlock}>
            <div className={s.codeBar}>JavaScript · Node.js</div>
            <pre>
              <span className={s.ck}>import</span>{" Helix "}<span className={s.ck}>from</span>{" "}<span className={s.cs}>{'"@helix-ai/sdk"'}</span>{";\n\n"}
              <span className={s.ck}>const</span>{" helix = "}<span className={s.ck}>new</span>{" Helix({\n"}
              {"  apiKey: "}<span className={s.cs}>{'"sk-helix-prod-..."'}</span>{",\n"}
              {"});\n\n"}
              <span className={s.ck}>const</span>{" result = "}<span className={s.ck}>await</span>{" helix.consensus({\n"}
              {"  prompt: "}<span className={s.cs}>{'"SaaS 가격 전략을 짜줘"'}</span>{",\n"}
              {"  agents: ["}<span className={s.cs}>{'"claude"'}</span>{", "}<span className={s.cs}>{'"gpt"'}</span>{", "}<span className={s.cs}>{'"gemini"'}</span>{"],\n"}
              {"  rounds: "}<span className={s.cn}>2</span>{",\n"}
              {"  glass_box: "}<span className={s.ck}>true</span>{",\n"}
              {"});\n\n"}
              {"console.log(result.answer);\n"}
              {"console.log(result.consensus_score); "}<span className={s.cc}>{"// 0.92"}</span>{"\n"}
              {"console.log(result.glass_box);       "}<span className={s.cc}>{"// [{agent, text, role}]"}</span>
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
