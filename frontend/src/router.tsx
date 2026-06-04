import { useEffect, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MarketingLayout } from "./layouts/MarketingLayout";
import { AppLayout } from "./layouts/AppLayout";
import { SettingsLayout } from "./layouts/SettingsLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PricingPage } from "./pages/PricingPage";
import { SettingsAccountPage } from "./pages/SettingsAccountPage";
import { SettingsApiPage } from "./pages/SettingsApiPage";
import { useAuth } from "./store/useAuth";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn);
  const loading = useAuth((s) => s.loading);
  if (loading) return null; // 세션 확인 중에는 깜빡임 방지
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  const checkAuth = useAuth((s) => s.checkAuth);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />

      <Route path="chat" element={<RequireAuth><AppLayout /></RequireAuth>} />

      <Route path="settings" element={<RequireAuth><SettingsLayout /></RequireAuth>}>
        <Route index element={<Navigate to="account" replace />} />
        <Route path="account" element={<SettingsAccountPage />} />
        <Route path="api" element={<SettingsApiPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
