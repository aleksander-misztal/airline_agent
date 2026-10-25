import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { ApiError, request } from "./client";

describe("request (HTTP client)", () => {
  it("sends JSON body with credentials and parses JSON response", async () => {
    let captured: { contentType: string | null; credentials: string; body: unknown } | undefined;
    server.use(
      http.post("*/api/echo", async ({ request: req }) => {
        captured = {
          contentType: req.headers.get("content-type"),
          credentials: req.credentials,
          body: await req.json(),
        };
        return HttpResponse.json({ ok: true });
      }),
    );

    const res = await request<{ ok: boolean }>("/api/echo", { method: "POST", body: { a: 1 } });

    expect(res).toEqual({ ok: true });
    expect(captured).toEqual({
      contentType: "application/json",
      credentials: "include",
      body: { a: 1 },
    });
  });

  it("throws ApiError with status and server message", async () => {
    server.use(
      http.get("*/api/broken", () => HttpResponse.json({ error: "Coś poszło nie tak" }, { status: 500 })),
    );

    const err = (await request("/api/broken").catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("Coś poszło nie tak");
  });

  it("throws ApiError with fallback message when body is not JSON", async () => {
    server.use(http.get("*/api/plain", () => new HttpResponse("nope", { status: 502 })));

    const err = (await request("/api/plain").catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.message).toBe("Błąd serwera (502)");
  });

  it("returns undefined for 204 No Content", async () => {
    server.use(http.delete("*/api/thing", () => new HttpResponse(null, { status: 204 })));

    await expect(request("/api/thing", { method: "DELETE" })).resolves.toBeUndefined();
  });
});
