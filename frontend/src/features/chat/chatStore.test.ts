import { delay, http, HttpResponse } from "msw";
import { authApi, chatApi } from "../../api";
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

describe("chatStore – conversations", () => {
  const seed = async (text: string) => {
    const conversation = await chatApi.createConversation();
    await chatApi.sendMessage(conversation.id, text);
    return conversation;
  };

  it("starts with an empty conversation list", () => {
    expect(state().conversations).toEqual([]);
  });

  it("loadConversations() fills the list, newest first", async () => {
    const a = await seed("Pierwsza");
    const b = await seed("Druga");

    await state().loadConversations();

    expect(state().conversations.map((c) => c.id)).toEqual([b.id, a.id]);
  });

  it("adds the conversation to the list after the first message", async () => {
    await state().sendMessage("Ile bagażu mogę zabrać?");

    expect(state().conversations).toHaveLength(1);
    expect(state().conversations[0]).toMatchObject({
      id: state().conversationId,
      title: "Ile bagażu mogę zabrać?",
    });
  });

  it("selectConversation() loads that conversation's messages", async () => {
    const a = await seed("Pierwsza");
    await seed("Druga");

    await state().selectConversation(a.id);

    expect(state().conversationId).toBe(a.id);
    expect(state().messages).toHaveLength(2);
    expect(texts()[0]).toBe("Pierwsza");
  });

  it("continues in the selected conversation", async () => {
    const a = await seed("Pierwsza");
    await state().selectConversation(a.id);

    await state().sendMessage("Dalej");

    expect(state().conversationId).toBe(a.id);
    expect(state().messages).toHaveLength(4);
  });

  it("keeps the previous chat and sets an error when loading a conversation fails", async () => {
    await state().sendMessage("Cześć");
    const before = { id: state().conversationId, messages: state().messages };

    await state().selectConversation("nope");

    expect(state().conversationId).toBe(before.id);
    expect(state().messages).toEqual(before.messages);
    expect(state().error).toBe("Nie udało się wczytać rozmowy.");
  });

  it("ignores a stale response when switching conversations quickly", async () => {
    const a = await seed("A");
    const b = await seed("B");
    server.use(
      http.get("*/api/conversations/:id/messages", async ({ params }) => {
        if (params.id === a.id) await delay(100);
        return HttpResponse.json([
          {
            id: `m-${params.id}`,
            conversationId: String(params.id),
            role: "user",
            type: "text",
            payload: { text: `msg-${params.id}` },
            createdAt: "2026-11-01T10:00:00Z",
          },
        ]);
      }),
    );

    const first = state().selectConversation(a.id);
    await state().selectConversation(b.id);
    await first;

    expect(state().conversationId).toBe(b.id);
    expect(texts()).toEqual([`msg-${b.id}`]);
  });

  it("does not switch conversations while a message is being sent", async () => {
    const a = await seed("Pierwsza");
    server.use(
      http.post("*/api/conversations/:id/messages", async () => {
        await delay(100);
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );
    const pending = state().sendMessage("Nowa");
    await vi.waitFor(() => expect(state().sending).toBe(true));

    await state().selectConversation(a.id);

    expect(state().conversationId).not.toBe(a.id);
    await pending;
  });

  it("newConversation() clears the chat but keeps the list", async () => {
    await state().sendMessage("Cześć");

    state().newConversation();

    expect(state()).toMatchObject({ conversationId: null, messages: [], error: null });
    expect(state().conversations).toHaveLength(1);
  });

  it("deleteConversation() removes it from the list and the server", async () => {
    const a = await seed("Pierwsza");
    await state().loadConversations();

    await state().deleteConversation(a.id);

    expect(state().conversations).toEqual([]);
    await expect(chatApi.listConversations()).resolves.toEqual([]);
  });

  it("deleting the active conversation resets the chat", async () => {
    await state().sendMessage("Cześć");

    await state().deleteConversation(state().conversationId!);

    expect(state()).toMatchObject({ conversationId: null, messages: [], conversations: [] });
  });

  it("deleting another conversation keeps the active chat", async () => {
    const other = await seed("Inna");
    await state().sendMessage("Cześć");
    const activeId = state().conversationId;

    await state().deleteConversation(other.id);

    expect(state().conversationId).toBe(activeId);
    expect(state().messages).toHaveLength(2);
    expect(state().conversations.map((c) => c.id)).toEqual([activeId]);
  });

  it("sets an error and keeps the list when deleting fails", async () => {
    const a = await seed("Pierwsza");
    await state().loadConversations();
    server.use(http.delete("*/api/conversations/:id", () => HttpResponse.json({ error: "x" }, { status: 500 })));

    await state().deleteConversation(a.id);

    expect(state().conversations).toHaveLength(1);
    expect(state().error).toBe("Nie udało się usunąć rozmowy.");
  });

  it("reset() also clears the conversation list", async () => {
    await state().sendMessage("Cześć");

    state().reset();

    expect(state().conversations).toEqual([]);
  });
});
