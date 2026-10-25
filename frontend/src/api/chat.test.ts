import { authApi } from "./auth";
import { chatApi } from "./chat";
import { ApiError } from "./client";

describe("chatApi – without session", () => {
  it("rejects requests with 401", async () => {
    const err = await chatApi.listConversations().catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });
});

describe("chatApi – conversations", () => {
  beforeEach(async () => {
    await authApi.login("admin", "admin");
  });

  it("starts with an empty list", async () => {
    await expect(chatApi.listConversations()).resolves.toEqual([]);
  });

  it("creates a conversation with default title", async () => {
    const conv = await chatApi.createConversation();

    expect(conv).toMatchObject({ id: expect.any(String), title: "Nowa rozmowa" });
    await expect(chatApi.listConversations()).resolves.toEqual([conv]);
  });

  it("lists newest conversations first", async () => {
    const first = await chatApi.createConversation();
    const second = await chatApi.createConversation();

    const list = await chatApi.listConversations();

    expect(list.map((c) => c.id)).toEqual([second.id, first.id]);
  });

  it("deletes a conversation", async () => {
    const conv = await chatApi.createConversation();

    await chatApi.deleteConversation(conv.id);

    await expect(chatApi.listConversations()).resolves.toEqual([]);
  });

  it("returns 404 when deleting unknown conversation", async () => {
    const err = await chatApi.deleteConversation("nope").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

describe("chatApi – messages", () => {
  let conversationId: string;

  beforeEach(async () => {
    await authApi.login("admin", "admin");
    conversationId = (await chatApi.createConversation()).id;
  });

  it("returns the user message and the assistant reply", async () => {
    const { userMessage, reply } = await chatApi.sendMessage(conversationId, "Cześć");

    expect(userMessage).toMatchObject({
      role: "user",
      type: "text",
      payload: { text: "Cześć" },
    });
    expect(reply).toMatchObject({ role: "assistant", type: "text" });
  });

  it("keeps message history in order", async () => {
    const { userMessage, reply } = await chatApi.sendMessage(conversationId, "Cześć");

    const messages = await chatApi.listMessages(conversationId);

    expect(messages.map((m) => m.id)).toEqual([userMessage.id, reply.id]);
  });

  it("sets conversation title from the first message", async () => {
    await chatApi.sendMessage(conversationId, "Jaki jest limit bagażu podręcznego?");

    const [conv] = await chatApi.listConversations();

    expect(conv.title).toBe("Jaki jest limit bagażu podręcznego?");
  });

  it("replies with a flight card when asked about flight status", async () => {
    const { reply } = await chatApi.sendMessage(conversationId, "Jaki jest status lotu QR123?");

    expect(reply.type).toBe("flight_card");
    expect(reply.payload).toMatchObject({ flightNumber: "QR123", from: expect.any(String), to: expect.any(String) });
  });

  it.each([
    ["Ile bagażu mogę zabrać?", /bagaż/i],
    ["Chcę zmienić rezerwację", /rezerwac/i],
    ["Jak zrobić odprawę online?", /odpraw/i],
  ])("answers keyword question: %s", async (question, expected) => {
    const { reply } = await chatApi.sendMessage(conversationId, question);

    expect(reply.type).toBe("text");
    expect((reply.payload as { text: string }).text).toMatch(expected);
  });

  it("rejects empty message with 400", async () => {
    const err = await chatApi.sendMessage(conversationId, "   ").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
  });

  it("returns 404 for unknown conversation", async () => {
    const err = await chatApi.sendMessage("nope", "Cześć").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});
