import { authApi } from "../../api";
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
