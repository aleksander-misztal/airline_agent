import { ApiError, request } from "./client";
import type { User } from "./types";

export const authApi = {
  async login(username: string, password: string): Promise<User> {
    const { user } = await request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    return user;
  },

  async logout(): Promise<void> {
    await request<void>("/api/auth/logout", { method: "POST" });
  },

  /** Zwraca zalogowanego użytkownika albo null, gdy brak sesji. */
  async me(): Promise<User | null> {
    try {
      const { user } = await request<{ user: User }>("/api/auth/me");
      return user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
};
