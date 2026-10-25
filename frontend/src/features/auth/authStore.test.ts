import { http, HttpResponse } from "msw";
import { authApi, chatApi } from "../../api";
import { server } from "../../api/mocks/server";
import { useAuthStore } from "./authStore";

const state = () => useAuthStore.getState();

describe("authStore", () => {
  it("starts in loading state without a user", () => {
    expect(state()).toMatchObject({ status: "loading", user: null, error: null });
  });

  it("init() → anonymous when there is no session", async () => {
    await state().init();

    expect(state()).toMatchObject({ status: "anonymous", user: null });
  });

  it("init() → authenticated when a session exists", async () => {
    await authApi.login("admin", "admin");

    await state().init();

    expect(state()).toMatchObject({ status: "authenticated", user: { username: "admin" } });
  });

  it("login() with admin/admin authenticates and returns true", async () => {
    const ok = await state().login("admin", "admin");

    expect(ok).toBe(true);
    expect(state()).toMatchObject({ status: "authenticated", user: { username: "admin" }, error: null });
  });

  it("login() with wrong password stays anonymous and stores the error", async () => {
    const ok = await state().login("admin", "wrong");

    expect(ok).toBe(false);
    expect(state()).toMatchObject({
      status: "anonymous",
      user: null,
      error: "Nieprawidłowy login lub hasło",
    });
  });

  it("login() clears the previous error on a successful retry", async () => {
    await state().login("admin", "wrong");
    await state().login("admin", "admin");

    expect(state().error).toBeNull();
  });

  it("logout() clears the user and ends the session", async () => {
    await state().login("admin", "admin");

    await state().logout();

    expect(state()).toMatchObject({ status: "anonymous", user: null });
    await expect(authApi.me()).resolves.toBeNull();
  });
});

describe("authStore – session expiry", () => {
  it("expireSession() ends an authenticated session with a message", async () => {
    await state().login("admin", "admin");

    state().expireSession();

    expect(state()).toMatchObject({
      status: "anonymous",
      user: null,
      error: "Sesja wygasła. Zaloguj się ponownie.",
    });
  });

  it("expireSession() does nothing when nobody is logged in", async () => {
    await state().init();

    state().expireSession();

    expect(state().error).toBeNull();
  });

  it("a 401 from the chat API while logged in expires the session", async () => {
    await state().login("admin", "admin");
    server.use(http.get("*/api/conversations", () => HttpResponse.json({ error: "x" }, { status: 401 })));

    await chatApi.listConversations().catch(() => {});

    expect(state()).toMatchObject({ status: "anonymous", error: "Sesja wygasła. Zaloguj się ponownie." });
  });
});
