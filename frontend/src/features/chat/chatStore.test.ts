import { delay, http, HttpResponse } from "msw";
import { authApi } from "../../api";
import { server } from "../../api/mocks/server";
import { useChatStore } from "./chatStore";

const state = () => useChatStore.getState();
const texts = () => state().messages.map((m) => (m.payload as { text?: string }).text);

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

describe("chatStore", () => {
  it("starts empty", () => {
    expect(state()).toMatchObject({ conversationId: null, messages: [], sending: false, error: null });
  });

  it("creates a conversation on the first message and appends user message and reply", async () => {
    const ok = await state().sendMessage("Cześć");

    expect(ok).toBe(true);
    expect(state().conversationId).toEqual(expect.any(String));
    expect(state().messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(texts()[0]).toBe("Cześć");
    expect(state()).toMatchObject({ sending: false, error: null });
  });

  it("reuses the same conversation for the next messages", async () => {
    await state().sendMessage("Cześć");
    const id = state().conversationId;

    await state().sendMessage("Ile bagażu mogę zabrać?");

    expect(state().conversationId).toBe(id);
    expect(state().messages).toHaveLength(4);
  });

  it("shows the user message optimistically while the request is in flight", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", async () => {
        await delay(100);
        return HttpResponse.json({ error: "późno" }, { status: 500 });
      }),
    );

    const pending = state().sendMessage("Cześć");

    await vi.waitFor(() => expect(state().sending).toBe(true));
    expect(state().messages).toHaveLength(1);
    expect(state().messages[0]).toMatchObject({ role: "user", payload: { text: "Cześć" } });
    expect(state().messages[0].id).toMatch(/^pending-/);
    await pending;
  });

  it("replaces the optimistic message with the server one", async () => {
    await state().sendMessage("Cześć");

    expect(state().messages.some((m) => m.id.startsWith("pending-"))).toBe(false);
  });

  it("ignores blank messages without calling the API", async () => {
    const ok = await state().sendMessage("   ");

    expect(ok).toBe(false);
    expect(state()).toMatchObject({ conversationId: null, messages: [], sending: false });
  });

  it("ignores a new message while another one is being sent", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", async () => {
        await delay(100);
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );
    const first = state().sendMessage("Pierwsza");
    await vi.waitFor(() => expect(state().sending).toBe(true));

    await expect(state().sendMessage("Druga")).resolves.toBe(false);
    await first;
  });

  it("drops the optimistic message and stores an error when the API fails", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", () => HttpResponse.json({ error: "Awaria" }, { status: 500 })),
    );

    const ok = await state().sendMessage("Cześć");

    expect(ok).toBe(false);
    expect(state().messages).toEqual([]);
    expect(state()).toMatchObject({
      sending: false,
      error: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
    });
  });

  it("clears the error on the next successful send", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", () => HttpResponse.json({ error: "Awaria" }, { status: 500 }), {
        once: true,
      }),
    );
    await state().sendMessage("Cześć");

    await state().sendMessage("Cześć");

    expect(state().error).toBeNull();
  });

  it("reset() clears everything", async () => {
    await state().sendMessage("Cześć");

    state().reset();

    expect(state()).toMatchObject({ conversationId: null, messages: [], sending: false, error: null });
  });
});
