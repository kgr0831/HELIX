import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,

  // 앱 시작 시 쿠키 세션으로 로그인 상태 확인
  checkAuth: async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (r.ok) {
        const user = await r.json();
        set({ user, isLoggedIn: true, loading: false });
      } else {
        set({ user: null, isLoggedIn: false, loading: false });
      }
    } catch {
      set({ user: null, isLoggedIn: false, loading: false });
    }
  },

  // 백엔드 OAuth 진입점으로 이동 (Google 동의 화면으로 redirect)
  loginWithGoogle: () => {
    window.location.href = "/api/auth/google/login";
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    set({ user: null, isLoggedIn: false });
    window.location.href = "/login";
  },
}));
