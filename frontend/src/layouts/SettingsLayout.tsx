import { Outlet, Link, NavLink } from "react-router-dom";
import { HelixMark } from "../components/Logo";
import s from "./SettingsLayout.module.css";

export function SettingsLayout() {
  return (
    <div className={s.layout} data-theme="dark">
      <aside className={s.side}>
        <Link to="/" className={s.brandRow}>
          <HelixMark size={22} />
          <span className="brand-wordmark">
            HEL<span style={{ color: "var(--accent)" }}>I</span>X
          </span>
        </Link>
        <Link to="/chat" className={s.back}>← 채팅으로 돌아가기</Link>

        <div className={s.navGroup}>
          <h5>설정</h5>
          <NavLink to="/settings/account" className={({ isActive }) => isActive ? s.navItemActive : s.navItem}>계정</NavLink>
          <a href="#" className={s.navItem}>알림</a>
          <a href="#" className={s.navItem}>테마 · 표시</a>
          <a href="#" className={s.navItem}>사용량</a>
        </div>
        <div className={s.navGroup}>
          <h5>워크스페이스</h5>
          <a href="#" className={s.navItem}>멤버</a>
          <a href="#" className={s.navItem}>기본 모델 정책</a>
          <a href="#" className={s.navItem}>프롬프트 라이브러리</a>
        </div>
        <div className={s.navGroup}>
          <h5>개발자 · 결제</h5>
          <NavLink to="/settings/api" className={({ isActive }) => isActive ? s.navItemActive : s.navItem}>
            API 키 <span className={s.badge}>2</span>
          </NavLink>
          <a href="#" className={s.navItem}>결제 · 인보이스</a>
        </div>
      </aside>

      <main className={s.content}>
        <Outlet />
      </main>
    </div>
  );
}
