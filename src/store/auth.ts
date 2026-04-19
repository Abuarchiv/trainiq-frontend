import { create } from "zustand";

interface User { id: string; email: string; name: string; }

interface AuthStore {
  token: string | null;
  user: User | null;
  /** true once `init()` has run — prevents flash of unauthenticated state */
  isChecked: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isChecked: false,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user, isChecked: true });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  init: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr), isChecked: true });
        return;
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    set({ isChecked: true });
  },
}));
