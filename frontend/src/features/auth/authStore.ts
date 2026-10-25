import { create } from "zustand";
import { ApiError, authApi, type User } from "../../api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  /** Odtwarza sesję po odświeżeniu strony. */
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",
  error: null,

  async init() {
    try {
      const user = await authApi.me();
      set({ user, status: user ? "authenticated" : "anonymous" });
    } catch {
      set({ user: null, status: "anonymous" });
    }
  },

  async login(username, password) {
    set({ error: null });
    try {
      const user = await authApi.login(username, password);
      set({ user, status: "authenticated", error: null });
      return true;
    } catch (err) {
      const error = err instanceof ApiError ? err.message : "Nie udało się zalogować. Spróbuj ponownie.";
      set({ user: null, status: "anonymous", error });
      return false;
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: "anonymous", error: null });
    }
  },
}));
