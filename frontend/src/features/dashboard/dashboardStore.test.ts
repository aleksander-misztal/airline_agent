import { delay, http, HttpResponse } from "msw";
import { authApi } from "../../api";
import { server } from "../../api/mocks/server";
import { summary } from "../../api/mocks/dashboard";
import { useDashboardStore } from "./dashboardStore";

const state = () => useDashboardStore.getState();

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

describe("dashboardStore", () => {
  it("starts idle without data", () => {
    expect(state()).toMatchObject({ status: "idle", summary: null, error: null });
  });

  it("load() fetches the summary", async () => {
    await state().load();

    expect(state()).toMatchObject({ status: "ready", summary, error: null });
  });

  it("is in the loading state while the request is in flight", async () => {
    server.use(
      http.get("*/api/dashboard", async () => {
        await delay(100);
        return HttpResponse.json(summary);
      }),
    );

    const pending = state().load();

    expect(state().status).toBe("loading");
    await pending;
  });

  it("does not start a second request while loading", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/dashboard", async () => {
        calls += 1;
        await delay(50);
        return HttpResponse.json(summary);
      }),
    );

    await Promise.all([state().load(), state().load()]);

    expect(calls).toBe(1);
  });

  it("stores an error when the request fails, and recovers on retry", async () => {
    server.use(http.get("*/api/dashboard", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));

    await state().load();
    expect(state()).toMatchObject({ status: "error", summary: null, error: "Nie udało się wczytać danych." });

    await state().load();
    expect(state()).toMatchObject({ status: "ready", error: null });
  });

  it("reset() clears the data", async () => {
    await state().load();

    state().reset();

    expect(state()).toMatchObject({ status: "idle", summary: null, error: null });
  });
});
