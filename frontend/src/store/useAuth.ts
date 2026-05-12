import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  login: (id: string, pw: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,

  login: (id, pw) => {
    if (id === "test" && pw === "test") {
      set({ isLoggedIn: true, user: { name: "Test User", email: "test@helix.ai" } });
      return true;
    }
    return false;
  },

  logout: () => set({ isLoggedIn: false, user: null }),
}));
