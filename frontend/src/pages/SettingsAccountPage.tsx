import { useState } from "react";
import s from "./SettingsAccountPage.module.css";

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <button className={on ? s.switchOn : s.switch} onClick={() => setOn(!on)} />;
}

function Seg({ options, initial = 1 }: { options: string[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <div className={s.seg}>
      {options.map((opt, i) => (
        <button key={opt} className={i === active ? s.segBtnOn : s.segBtn} onClick={() => setActive(i)}>{opt}</button>
      ))}
    </div>
  );
}

export function SettingsAccountPage() {
  return (
    <>
      <div className={s.pageHead}>
        <h1>계정</h1>
        <p>프로필, 인증, 연결된 계정과 세션을 관리합니다.</p>
      </div>

      {/* ── Profile ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>프로필</h2>
            <p className={s.cbSub}>팀과 공유 채팅에서 보여지는 정보입니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.profileRow}>
            <div className={s.avatarBig}>JL</div>
            <div style={{ flex: 1 }}>
              <div className={s.avatarActions}>
                <button>새 사진 업로드</button>
                <button className={s.textOnly}>기본 이니셜 사용</button>
              </div>
              <div className={s.avatarHint}>JPG · PNG · 최대 2 MB · 정사각형 권장</div>
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label>이름</label>
              <input defaultValue="이지훈" />
            </div>
            <div className={s.field}>
              <label>표시 이름 (Display)</label>
              <input defaultValue="Jihoon Lee" />
            </div>
            <div className={s.fieldFull}>
              <label>이메일</label>
              <input defaultValue="jihoon@studio-foo.kr" type="email" />
              <span className={s.verified}>✓ 확인됨 · 2026.04.12</span>
            </div>
            <div className={s.field}>
              <label>역할 / 직책</label>
              <input defaultValue="Product Lead" placeholder="예: Product Lead" />
            </div>
            <div className={s.field}>
              <label>시간대</label>
              <select defaultValue="Asia/Seoul">
                <option value="Asia/Seoul">Asia/Seoul (GMT+09:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (GMT-07:00)</option>
                <option value="Europe/London">Europe/London (GMT+01:00)</option>
              </select>
            </div>
            <div className={s.fieldFull}>
              <label>한 줄 소개</label>
              <textarea defaultValue="핀테크 PM. AI 합의 의사결정에 관심 많습니다." />
              <span className={s.help}>팀 워크스페이스에서 멤버 카드에 표시됩니다. 280자.</span>
            </div>
          </div>
        </div>
        <div className={s.cbFoot}>
          <span>마지막 저장 5분 전</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={s.cancelBtn}>취소</button>
            <button className={s.saveBtn}>변경사항 저장</button>
          </div>
        </div>
      </section>

      {/* ── Response defaults ── */}
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
              <select defaultValue="ko">
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="auto">自动 / Auto</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className={s.field}>
              <label>기본 어조</label>
              <select defaultValue="balanced">
                <option value="balanced">균형 잡힌</option>
                <option value="analytical">분석적 · 보수적</option>
                <option value="creative">창의적 · 발산적</option>
                <option value="concise">간결 (Bullet)</option>
              </select>
            </div>
            <div className={s.field}>
              <label>기본 라운드 수</label>
              <Seg options={["1", "2", "3", "Auto"]} initial={1} />
              <span className={s.help}>합의 시간과 비용에 영향. Pro에서 최대 3.</span>
            </div>
            <div className={s.field}>
              <label>기본 에이전트 풀</label>
              <select defaultValue="auto">
                <option value="auto">Auto · 라우터에 위임 (권장)</option>
                <option value="2">Claude + GPT (2)</option>
                <option value="3">Claude + GPT + Gemini (3)</option>
                <option value="4">Claude + GPT + Gemini + DeepSeek (4)</option>
              </select>
            </div>
          </div>
        </div>
        <div className={s.cbFootRight}>
          <button className={s.saveBtn}>저장</button>
        </div>
      </section>

      {/* ── Security ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>보안 · 인증</h2>
            <p className={s.cbSub}>로그인 방법과 2단계 인증을 설정합니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>2단계 인증 (2FA)<span className={s.recommended}>강력 권장</span></h4>
              <p>인증 앱(Google Authenticator, 1Password 등)으로 6자리 코드를 추가로 확인합니다.</p>
            </div>
            <Toggle initial />
          </div>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>새 로그인 알림 이메일</h4>
              <p>인식되지 않은 기기 · 위치에서 로그인하면 즉시 이메일로 알림을 보냅니다.</p>
            </div>
            <Toggle initial />
          </div>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>비밀번호 변경</h4>
              <p>마지막 변경: 2025.11.04 · 6개월 전</p>
            </div>
            <button className={s.saveBtn} style={{ height: 30 }}>비밀번호 변경 →</button>
          </div>
        </div>
      </section>

      {/* ── Sessions ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>활성 세션</h2>
            <p className={s.cbSub}>지금 이 계정에 로그인된 기기 목록입니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          {[
            { icon: "💻", title: "MacBook Pro · Chrome 139", loc: "서울 · 121.130.xx.xx · 활성 · 방금 전", current: true },
            { icon: "📱", title: "iPhone 16 Pro · HELIX iOS 1.4", loc: "서울 · 211.230.xx.xx · 18분 전" },
            { icon: "💻", title: "Windows 11 · Edge 132", loc: "판교 · 175.197.xx.xx · 어제 14:22" },
            { icon: "🖥", title: "Linux · Firefox 128 (Wayland)", loc: "도쿄 · 153.149.xx.xx · 3일 전" },
          ].map((sess) => (
            <div key={sess.title} className={s.sessionRow}>
              <div className={s.devIcon}>{sess.icon}</div>
              <div className={s.sessionMeta}>
                <h4>{sess.title} {sess.current && <span className={s.currentBadge}>현재 세션</span>}</h4>
                <p>{sess.loc}</p>
              </div>
              {sess.current ? (
                <span style={{ color: "var(--fg-faint)", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>—</span>
              ) : (
                <button className={s.revokeBtn}>세션 종료</button>
              )}
            </div>
          ))}
        </div>
        <div className={s.cbFoot}>
          <span>총 4개 활성 세션</span>
          <button className={s.dangerBtn}>현재 세션 외 모두 종료</button>
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
          {[
            { icon: <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1.1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-2-6.2-4.6H2.2v2.9C4 19.9 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2.2c-.7 1.5-1.2 3.2-1.2 5s.4 3.5 1.2 5l3.6-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6L19.3 4C17.4 2.2 14.9 1 12 1 7.7 1 4 3.1 2.2 6.4l3.6 2.9c.9-2.6 3.3-3.9 6.2-3.9z"/></svg>, name: "Google", desc: "jihoon@studio-foo.kr · 2026.04.12 연결", connected: true },
            { icon: <svg viewBox="0 0 16 16" width="20" height="20"><path fill="currentColor" d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-1-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3-1.8 3.7-3.6 3.9.3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0z"/></svg>, name: "GitHub", desc: "연결되지 않음 · 코드 컨텍스트 첨부에 사용됩니다" },
            { icon: <span style={{ fontSize: 18 }}>💬</span>, name: "Slack", desc: "워크스페이스 채널에 합의 답변 공유 · 미연결" },
            { icon: <span style={{ fontSize: 18 }}>📝</span>, name: "Notion", desc: "합의 답변을 페이지로 내보내기 · 미연결" },
          ].map((conn) => (
            <div key={conn.name} className={s.connRow}>
              <div className={s.connIcon}>{conn.icon}</div>
              <div>
                <h4>{conn.name}</h4>
                <p>{conn.desc}</p>
              </div>
              <button className={conn.connected ? s.connBtnDisconnect : s.connBtn}>
                {conn.connected ? "연결 해제" : "연결"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className={s.cardBlock}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>개인정보 · 데이터</h2>
            <p className={s.cbSub}>대화 데이터의 보관과 사용 방식을 제어합니다.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>채팅 히스토리 저장</h4>
              <p>끄면 새로운 대화가 저장되지 않고, 세션 종료 시 모두 삭제됩니다.</p>
            </div>
            <Toggle initial />
          </div>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>모델 품질 개선에 데이터 사용</h4>
              <p><strong style={{ color: "var(--fg)" }}>학습에는 절대 사용되지 않습니다.</strong> 익명화된 합의 점수 통계만 라우터 개선에 활용됩니다.</p>
            </div>
            <Toggle />
          </div>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>활동 분석 (Analytics)</h4>
              <p>사용 패턴(어떤 기능을 쓰는지)을 익명으로 수집해 제품을 개선합니다.</p>
            </div>
            <Toggle initial />
          </div>
          <div className={s.toggleRow}>
            <div className={s.toggleInfo}>
              <h4>내 데이터 내보내기</h4>
              <p>모든 대화 · 설정 · 프롬프트를 JSON으로 받습니다. 처리에 최대 24시간.</p>
            </div>
            <button className={s.saveBtn} style={{ height: 30, background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)", fontWeight: 550 }}>내보내기 요청</button>
          </div>
        </div>
      </section>

      {/* ── Danger ── */}
      <section className={s.dangerZone}>
        <div className={s.cbHead}>
          <div style={{ flex: 1 }}>
            <h2>위험 구역</h2>
            <p className={s.cbSub}>되돌릴 수 없는 작업입니다. 신중히 진행해 주세요.</p>
          </div>
        </div>
        <div className={s.cbBody}>
          {[
            { title: "모든 채팅 히스토리 삭제", desc: "모든 대화 기록을 영구히 삭제합니다. 공유된 링크도 무효화됩니다.", btn: "히스토리 삭제" },
            { title: "워크스페이스에서 나가기", desc: '"Studio Foo" 워크스페이스에서 본인을 제거합니다. 본인이 만든 채팅은 남습니다.', btn: "워크스페이스 나가기" },
            { title: "계정 영구 삭제", desc: "모든 데이터를 삭제하고 계정을 닫습니다. 30일 유예 후 복구 불가.", btn: "계정 삭제" },
          ].map((item) => (
            <div key={item.title} className={s.dangerRow}>
              <div className={s.dangerRowInfo}>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
              <button className={s.dangerRowBtn}>{item.btn}</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
