import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { HelixMark } from "../components/Logo";
import { useAuth } from "../store/useAuth";
import s from "./MarketingLayout.module.css";

export function MarketingLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const scrollTo = useCallback((hash: string) => {
    if (pathname === "/") {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [pathname, navigate]);

  return (
    <div className={s.page} data-theme="dark">
      {/* ── Nav ── */}
      <header className={s.nav}>
        <div className={s.navInner}>
          <Link to="/" className={s.brand}>
            <HelixMark size={22} />
            <span className="brand-wordmark">
              HEL<span style={{ color: "var(--accent)" }}>I</span>X
            </span>
          </Link>
          <nav className={s.navLinks}>
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>작동 방식</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>기능</a>
            <Link to="/pricing" className={pathname === "/pricing" ? "active" : undefined}>가격</Link>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a>
          </nav>
          <div className={s.navCta}>
            {isLoggedIn ? (
              <Link to="/chat" className={s.btnPrimary}>채팅하기 →</Link>
            ) : (
              <>
                <Link to="/login" className={s.btn}>로그인</Link>
                <Link to="/login" className={s.btnPrimary}>무료 시작 →</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <Outlet />

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <div className={s.footInner}>
          <div className={s.footTop}>
            <div className={s.footCol}>
              <div className={s.brand} style={{ marginBottom: 14 }}>
                <HelixMark size={22} />
                <span className="brand-wordmark">
                  HEL<span style={{ color: "var(--accent)" }}>I</span>X
                </span>
              </div>
              <p className={s.footDesc}>
                서로 다른 LLM이 토론하고 합의해, 한 모델의 한계를 넘는 답을 만드는 AI 어시스턴트.
              </p>
            </div>
            <div className={s.footCol}>
              <h5>Product</h5>
              <ul>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>기능</a></li>
                <li><Link to="/pricing">가격</Link></li>
                <li><Link to="/settings/api">API</Link></li>
                <li><a href="#">체인지로그</a></li>
              </ul>
            </div>
            <div className={s.footCol}>
              <h5>Company</h5>
              <ul>
                <li><a href="#">소개</a></li>
                <li><a href="#">블로그</a></li>
                <li><a href="#">채용</a></li>
                <li><a href="#">미디어킷</a></li>
              </ul>
            </div>
            <div className={s.footCol}>
              <h5>Legal</h5>
              <ul>
                <li><a href="#">이용약관</a></li>
                <li><a href="#">개인정보처리방침</a></li>
                <li><a href="#">보안 / SOC 2</a></li>
                <li><a href="#">DPA</a></li>
              </ul>
            </div>
          </div>
          <div className={s.footBottom}>
            <div>© 2026 HELIX, Inc.</div>
            <div>v1.4.2 · status: <span style={{ color: "var(--accent)" }}>●</span> all systems operational</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
