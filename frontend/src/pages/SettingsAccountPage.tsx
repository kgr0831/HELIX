import { useEffect, useState } from "react";
import { useAuth } from "../store/useAuth";
import s from "./SettingsAccountPage.module.css";

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <button className={on ? s.switchOn : s.switch} onClick={() => setOn(!on)} />;
}

// 응답 기본값 — 라운드 선택용 컨트롤드 세그먼트
function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className={s.seg}>
      {options.map((opt) => (
        <button key={opt} className={opt === value ? s.segBtnOn : s.segBtn} onClick={() => onChange(opt)}>{opt}</button>
      ))}
    </div>
  );
}

interface Defaults { language: string; tone: string; rounds: string; agentPool: string; }
const FALLBACK: Defaults = { language: "ko", tone: "balanced", rounds: "2", agentPool: "auto" };

export function SettingsAccountPage() {
  const user = useAuth((st) => st.user);
  const [defaults, setDefaults] = useState<Defaults>(FALLBACK);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.defaults) setDefaults({ ...FALLBACK, ...d.defaults }); })
      .catch(() => {});
  }, []);

  const set = (k: keyof Defaults) => (v: string) => { setDefaults((d) => ({ ...d, [k]: v })); setSaved(false); setSaveError(false); };

  const saveDefaults = async () => {
    setSaveError(false);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults }),
      });
      if (r.ok) setSaved(true); else setSaveError(true);
    } catch {
      setSaveError(true);
    }
  };

  // 데이터 내보내기 / 히스토리 삭제 / 계정 삭제 (Phase C)
  const exportData = async () => {
    const r = await fetch("/api/account/export", { credentials: "include" });
    if (!r.ok) return;
    const data = await r.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "helix-export.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = async () => {
    if (!window.confirm("모든 대화 히스토리를 삭제할까요? 되돌릴 수 없습니다.")) return;
    await fetch("/api/conversations", { method: "DELETE", credentials: "include" });
    window.alert("히스토리를 삭제했습니다.");
  };

  const deleteAccount = async () => {
    if (!window.confirm("정말 계정을 영구 삭제할까요? 모든 데이터가 삭제되며 복구할 수 없습니다.")) return;
    if (!window.confirm("마지막 확인입니다. 계속 진행하시겠습니까?")) return;
    await fetch("/api/account", { method: "DELETE", credentials: "include" });
    window.location.href = "/login";
  };

  const initials = (user?.name ?? user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <>
      <div className={s.pageHead}>
        <h1>계정</h1>
        <p>프로필과 응답 기본값을 관리합니다.</p>
      </div>

      {/* ── Profile (Google 계정 기반, 읽기 전용) ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>프로필</h2>
            <p className={s.cbSub}>Google 계정에서 가져온 정보입니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.profileRow}>
            {user?.picture ? (
              <img className={s.avatarBig} src={user.picture} alt="" referrerPolicy="no-referrer" style={{ objectFit: "cover" }} />
            ) : (
              <div className={s.avatarBig}>{initials}</div>
            )}
            <div style={{ flex: 1 }}>
              <div className={s.avatarHint}>프로필 사진과 이름은 Google 계정에서 관리됩니다.</div>
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label>이름</label>
              <input value={user?.name ?? ""} readOnly />
            </div>
            <div className={s.fieldFull}>
              <label>이메일</label>
              <input value={user?.email ?? ""} type="email" readOnly />
              <span className={s.verified}>✓ Google 인증됨</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Response defaults (DB 저장) ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>응답 기본값</h2>
            <p className={s.cbSub}>새 채팅에 적용되는 기본 합의 설정입니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label>기본 응답 언어</label>
              <select value={defaults.language} onChange={(e) => set("language")(e.target.value)}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="auto">自动 / Auto</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className={s.field}>
              <label>기본 어조</label>
              <select value={defaults.tone} onChange={(e) => set("tone")(e.target.value)}>
                <option value="balanced">균형 잡힌</option>
                <option value="analytical">분석적 · 보수적</option>
                <option value="creative">창의적 · 발산적</option>
                <option value="concise">간결 (Bullet)</option>
              </select>
            </div>
            <div className={s.field}>
              <label>기본 라운드 수</label>
              <Seg options={["1", "2", "3", "Auto"]} value={defaults.rounds} onChange={set("rounds")} />
              <span className={s.help}>합의 시간과 비용에 영향.</span>
            </div>
            <div className={s.field}>
              <label>기본 에이전트 풀</label>
              <select value={defaults.agentPool} onChange={(e) => set("agentPool")(e.target.value)}>
                <option value="auto">Auto · 라우터에 위임 (권장)</option>
                <option value="2">GPT + Gemini (2)</option>
                <option value="3">GPT + Gemini + Sonar (3)</option>
                <option value="4">GPT + Gemini + Sonar + Grok (4)</option>
              </select>
            </div>
          </div>
        </div>
        <div className={s.cbFootRight}>
          {saved && <span style={{ color: "var(--accent)", fontSize: 12, marginRight: 8 }}>저장됨 ✓</span>}
          {saveError && <span style={{ color: "#f87171", fontSize: 12, marginRight: 8 }}>저장 실패 — 다시 시도</span>}
          <button className={s.saveBtn} onClick={saveDefaults}>저장</button>
        </div>
      </section>

      {/* ── 아래 섹션들은 데모(정적) — 백엔드 미연동 ── */}

      {/* ── Security ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>보안 · 인증 <span className={s.cbSub}>(데모)</span></h2>
            <p className={s.cbSub}>Google OAuth로 로그인합니다. 비밀번호는 사용하지 않습니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>새 로그인 알림 이메일</h4>
              <p>인식되지 않은 기기 · 위치에서 로그인하면 이메일로 알립니다.</p>
            </div>
            <Toggle initial />
          </div>
        </div>
      </section>

      {/* ── Connections ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>연결된 계정</h2>
            <p className={s.cbSub}>소셜 로그인 및 외부 통합.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.connRow}>
            <div className={s.connIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1.1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-2-6.2-4.6H2.2v2.9C4 19.9 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2.2c-.7 1.5-1.2 3.2-1.2 5s.4 3.5 1.2 5l3.6-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6L19.3 4C17.4 2.2 14.9 1 12 1 7.7 1 4 3.1 2.2 6.4l3.6 2.9c.9-2.6 3.3-3.9 6.2-3.9z"/></svg>
            </div>
            <div>
              <h4>Google</h4>
              <p>{user?.email ?? "연결됨"} · 로그인에 사용 중</p>
            </div>
            <button className={s.connBtnDisconnect} disabled>연결됨</button>
          </div>
        </div>
      </section>

      {/* ── 데이터 (실제 동작) ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>데이터</h2>
            <p className={s.cbSub}>내 데이터를 내보내거나 삭제합니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>내 데이터 내보내기</h4>
              <p>프로필 · 설정 · 사용량 · 모든 대화를 JSON 파일로 다운로드합니다.</p>
            </div>
            <button className={s.saveBtn} style={{ height: 30, background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)", fontWeight: 550 }} onClick={exportData}>내보내기</button>
          </div>
        </div>
      </section>

      {/* ── Danger (실제 동작) ── */}
      <section className={s.dangerZone}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>위험 구역</h2>
            <p className={s.cbSub}>되돌릴 수 없는 작업입니다. 신중히 진행해 주세요.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.dangerRow}>
            <div className={s.dangerRowInfo}>
              <h4>모든 채팅 히스토리 삭제</h4>
              <p>모든 대화 기록을 영구히 삭제합니다. 계정은 유지됩니다.</p>
            </div>
            <button className={s.dangerRowBtn} onClick={clearHistory}>히스토리 삭제</button>
          </div>
          <div className={s.dangerRow}>
            <div className={s.dangerRowInfo}>
              <h4>계정 영구 삭제</h4>
              <p>모든 데이터를 삭제하고 계정을 닫습니다. 복구할 수 없습니다.</p>
            </div>
            <button className={s.dangerRowBtn} onClick={deleteAccount}>계정 삭제</button>
          </div>
        </div>
      </section>
    </>
  );
}
