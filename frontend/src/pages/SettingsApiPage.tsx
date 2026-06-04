import { useEffect, useState } from "react";
import s from "./SettingsApiPage.module.css";

interface ApiKey { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null; }
interface Usage { total_calls: number; total_tokens: number; }

const ENDPOINTS = [
  { method: "POST", path: "/api/v1/consensus", desc: "합의 호출 (JSON 응답)" },
  { method: "POST", path: "/api/query", desc: "합의 호출 (SSE 스트림)" },
  { method: "GET", path: "/api/conversations", desc: "대화 목록 조회" },
  { method: "GET", path: "/api/usage", desc: "사용량 조회" },
];

const API_BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";
const CALL_CAP = 5000; // 표시용 한도(데모)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function SettingsApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage>({ total_calls: 0, total_tokens: 0 });
  const [newKey, setNewKey] = useState<string | null>(null); // 방금 생성된 평문 키(1회 노출)

  const loadKeys = () => fetch("/api/keys", { credentials: "include" }).then(r => r.ok ? r.json() : []).then(setKeys);
  const loadUsage = () => fetch("/api/usage", { credentials: "include" }).then(r => r.ok ? r.json() : { total_calls: 0, total_tokens: 0 }).then(setUsage);

  useEffect(() => { loadKeys(); loadUsage(); }, []);

  const createKey = async () => {
    const name = window.prompt("새 API 키 이름", "기본 키");
    if (name === null) return;
    const r = await fetch("/api/keys", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "기본 키" }),
    });
    if (r.ok) {
      const created = await r.json();
      setNewKey(created.key);
      loadKeys();
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("이 키를 폐기할까요? 이 키로 더 이상 접근할 수 없습니다.")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE", credentials: "include" });
    loadKeys();
  };

  const callPct = Math.min(100, Math.round((usage.total_calls / CALL_CAP) * 100));

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
            <button className={s.createBtn} onClick={createKey}>+ 새 키 생성</button>
          </div>
        </div>

        {newKey && (
          <div className={s.cbBody}>
            <div className={s.keyRow} style={{ background: "var(--surface)", border: "1px solid var(--accent)" }}>
              <div>
                <div className={s.keyName}>새 키가 생성되었습니다 — 지금 복사하세요 (다시 표시되지 않음)</div>
                <div className={s.keyMask} style={{ color: "var(--fg)" }}>{newKey}</div>
              </div>
              <div className={s.keyActions}>
                <button className={s.keyBtn} onClick={() => navigator.clipboard.writeText(newKey)}>복사</button>
                <button className={s.keyBtn} onClick={() => setNewKey(null)}>닫기</button>
              </div>
            </div>
          </div>
        )}

        <div className={s.cbBody}>
          {keys.length === 0 && <div className={s.keyMeta}>아직 생성된 키가 없습니다.</div>}
          {keys.map((k) => (
            <div key={k.id} className={s.keyRow}>
              <div>
                <div className={s.keyName}>{k.name}</div>
                <div className={s.keyMask}>{k.prefix}</div>
                <div className={s.keyMeta}>생성: {fmtDate(k.created_at)} · 마지막 사용: {k.last_used_at ? fmtDate(k.last_used_at) : "없음"}</div>
              </div>
              <div className={s.keyActions}>
                <button className={s.keyBtnDanger} onClick={() => revokeKey(k.id)}>폐기</button>
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
            <h2>사용량</h2>
            <p className={s.cbSub}>이 계정의 누적 합의 호출 및 토큰 사용량</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${callPct}%` }} />
          </div>
          <div className={s.progressLabel}>
            <span>{usage.total_calls.toLocaleString()} / {CALL_CAP.toLocaleString()} 호출 사용</span>
            <span>{callPct}%</span>
          </div>
          <div className={s.usageGrid}>
            <div className={s.usageStat}>
              <div className="val"><span>{usage.total_calls.toLocaleString()}</span></div>
              <div className="lbl">합의 호출</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">{usage.total_tokens.toLocaleString()}</div>
              <div className="lbl">누적 토큰</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">Free</div>
              <div className="lbl">현재 플랜</div>
            </div>
            <div className={s.usageStat}>
              <div className="val">{Math.max(0, CALL_CAP - usage.total_calls).toLocaleString()}</div>
              <div className="lbl">남은 호출</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Endpoints (정적 레퍼런스) ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>엔드포인트 레퍼런스</h2>
            <p className={s.cbSub}>Base URL: {API_BASE} · 인증: <code>Authorization: Bearer sk-helix-…</code></p>
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

      {/* ── Quick start (정적) ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>퀵 스타트</h2>
            <p className={s.cbSub}>아래 코드를 복사해 바로 시작하세요.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.codeBlock}>
            <div className={s.codeBar}>cURL</div>
            <pre>
              {"curl -X POST "}<span className={s.cs}>{API_BASE}/api/v1/consensus</span>{" \\\n"}
              {"  -H "}<span className={s.cs}>{'"Authorization: Bearer sk-helix-..."'}</span>{" \\\n"}
              {"  -H "}<span className={s.cs}>{'"Content-Type: application/json"'}</span>{" \\\n"}
              {"  -d "}<span className={s.cs}>{'\'{"question": "크리스토퍼 놀란 영화 중 흥행 1위는?"}\''}</span>{"\n\n"}
              <span className={s.cc}>{"# 응답(JSON):"}</span>{"\n"}
              <span className={s.cc}>{'# { "answer": "...", "consensus": true, "token_usage": {...},'}</span>{"\n"}
              <span className={s.cc}>{'#   "cached": false, "conversation_id": "..." }'}</span>
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
