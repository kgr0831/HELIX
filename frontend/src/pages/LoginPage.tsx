import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelixMark } from "../components/Logo";
import { useAuth } from "../store/useAuth";
import s from "./LoginPage.module.css";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "계정에 로그인",
    sub: "여러 모델의 합의를 한 번의 질문으로.",
    submit: "로그인 →",
    foot: "계정이 없으신가요?",
    footAction: "회원가입",
    pw: "current-password" as const,
  },
  signup: {
    title: "HELIX 계정 만들기",
    sub: "14일 Pro 무료 체험. 신용카드 불필요.",
    submit: "계정 만들기 →",
    foot: "이미 계정이 있나요?",
    footAction: "로그인",
    pw: "new-password" as const,
  },
};

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const c = COPY[mode];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = login(email, pw);
    if (ok) {
      navigate("/chat");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className={s.auth} data-theme="dark">
      {/* ── Side panel ── */}
      <aside className={s.authSide}>
        <div className={s.authBrand}>
          <HelixMark size={24} />
          <span className="brand-wordmark">
            HEL<span style={{ color: "var(--accent)" }}>I</span>X
          </span>
          <span className="brand-sub mono" style={{ marginLeft: 4 }}>eXchange</span>
        </div>

        <div className={s.authPitch}>
          <h1>혼자가 아닌, <em>합의된 답</em>을 받는 AI.</h1>
          <p>
            HELIX는 Claude, GPT, Gemini, DeepSeek 등 서로 다른 LLM이 토론·교차검증해 한 모델의 한계를 넘는 답변을 합성합니다.
          </p>

          <div className={s.authQuote}>
            <p>"중요한 의사결정에 단일 모델 답변을 그대로 쓰진 않습니다. HELIX의 합의 점수가 표시되면 그제야 안심돼요."</p>
            <div className={s.authQuoteWho}>
              <span className={s.authQuoteAvatar}>JL</span>
              <span>이지훈 · 핀테크 PM</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form ── */}
      <section className={s.authForm}>
        <div className={s.authMobileBrand}>
          <HelixMark size={24} />
          <span className="brand-wordmark" style={{ marginLeft: 8 }}>
            HEL<span style={{ color: "var(--accent)" }}>I</span>X
          </span>
        </div>

        <div className={s.tabs}>
          <button
            className={mode === "login" ? s.tabActive : s.tab}
            onClick={() => setMode("login")}
          >
            로그인
          </button>
          <button
            className={mode === "signup" ? s.tabActive : s.tab}
            onClick={() => setMode("signup")}
          >
            회원가입
          </button>
        </div>

        <h2>{c.title}</h2>
        <p className={s.sub}>{c.sub}</p>

        <div className={s.oauth}>
          <button className={s.oauthBtn}>
            <span className={s.oauthIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1.1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.8 3.3-8.1z" />
                <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-2-6.2-4.6H2.2v2.9C4 19.9 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2.2c-.7 1.5-1.2 3.2-1.2 5s.4 3.5 1.2 5l3.6-2.9z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6L19.3 4C17.4 2.2 14.9 1 12 1 7.7 1 4 3.1 2.2 6.4l3.6 2.9c.9-2.6 3.3-3.9 6.2-3.9z" />
              </svg>
            </span>
            <span className={s.oauthGrow}>Google로 계속하기</span>
          </button>
          <button className={s.oauthBtn}>
            <span className={s.oauthIcon}>
              <svg viewBox="0 0 16 16" width="18" height="18">
                <path fill="currentColor" d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-1-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3-1.8 3.7-3.6 3.9.3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0z" />
              </svg>
            </span>
            <span className={s.oauthGrow}>GitHub로 계속하기</span>
          </button>
        </div>

        <div className={s.divider}>또는</div>

        <form onSubmit={handleSubmit}>
          <div className={s.field}>
            <label htmlFor="email">이메일</label>
            <input id="email" type="text" placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={s.field}>
            <label htmlFor="pw">
              비밀번호
              {mode === "login" && <a href="#">비밀번호 찾기</a>}
            </label>
            <input id="pw" type="password" placeholder="••••••••" autoComplete={c.pw} value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button type="submit" className={s.authSubmit}>{c.submit}</button>
        </form>

        <div className={s.authFoot}>
          {c.foot}{" "}
          <a onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {c.footAction}
          </a>
        </div>

        <p className={s.tos}>
          계속 진행하면 HELIX의 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
        </p>
      </section>
    </div>
  );
}
