import { authApi } from "./auth";
import { ApiError } from "./client";

describe("authApi", () => {
  it("logs in admin/admin and returns the user", async () => {
    const user = await authApi.login("admin", "admin");

    expect(user).toMatchObject({ username: "admin", displayName: expect.any(String) });
  });

  it("rejects wrong credentials with 401", async () => {
    const err = await authApi.login("admin", "wrong").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.message).toBe("Nieprawidłowy login lub hasło");
  });

  it("me() returns null when not logged in", async () => {
    await expect(authApi.me()).resolves.toBeNull();
  });

  it("me() returns the user after login", async () => {
    await authApi.login("admin", "admin");

    await expect(authApi.me()).resolves.toMatchObject({ username: "admin" });
  });

  it("logout() ends the session", async () => {
    await authApi.login("admin", "admin");
    await authApi.logout();

    await expect(authApi.me()).resolves.toBeNull();
  });
});
