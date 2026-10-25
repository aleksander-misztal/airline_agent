import { http, HttpResponse } from "msw";
import type { Conversation, Message, SendMessageResult } from "../types";
import { searchAirports } from "./airports";
import { botReply } from "./bot";
import { summary } from "./dashboard";
import { db, MOCK_USER } from "./db";
import { bookingsFor, generateOffers, validateSearch } from "./flights";

const DEFAULT_TITLE = "Nowa rozmowa";
const MAX_TITLE_LENGTH = 40;

const error = (status: number, message: string) => HttpResponse.json({ error: message }, { status });
const unauthorized = () => error(401, "Brak autoryzacji");

export const handlers = [
  http.get("*/api/health", () => HttpResponse.json({ status: "ok" })),

  // Mock: admin/admin zawsze wpuszcza. Docelowo hasła hashowane (argon2id) + JWT w ciasteczku httpOnly.
  http.post("*/api/auth/login", async ({ request }) => {
    const { username, password } = (await request.json()) as { username?: string; password?: string };
    if (username !== "admin" || password !== "admin") {
      return error(401, "Nieprawidłowy login lub hasło");
    }
    db.session = MOCK_USER;
    return HttpResponse.json({ user: MOCK_USER });
  }),

  http.post("*/api/auth/logout", () => {
    db.session = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/auth/me", () => (db.session ? HttpResponse.json({ user: db.session }) : unauthorized())),

  http.get("*/api/dashboard", () => {
    if (!db.session) return unauthorized();
    const upcomingBookings = [...summary.upcomingBookings, ...db.bookings].sort(
      (a, b) => Date.parse(a.departure) - Date.parse(b.departure),
    );
    return HttpResponse.json({ ...summary, upcomingBookings });
  }),

  http.get("*/api/flights/search", ({ request }) => {
    if (!db.session) return unauthorized();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const result = validateSearch(query);
    if (!result.ok) return error(400, result.error);
    return HttpResponse.json({ offers: generateOffers(result.params) });
  }),

  http.post("*/api/bookings", async ({ request }) => {
    if (!db.session) return unauthorized();
    const body = (await request.json().catch(() => null)) as { offerId?: unknown; search?: Record<string, unknown> } | null;
    const result = validateSearch(body?.search ?? {});
    if (!result.ok) return error(400, result.error);

    const offer = generateOffers(result.params).find((o) => o.id === body?.offerId);
    if (!offer) return error(404, "Nie znaleziono oferty");

    const reference = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    const bookings = bookingsFor(offer, result.params.cabin, reference);
    db.bookings.push(...bookings);
    return HttpResponse.json({ reference, bookings }, { status: 201 });
  }),

  http.get("*/api/airports", ({ request }) => {
    if (!db.session) return unauthorized();
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return HttpResponse.json(searchAirports(q));
  }),

  http.get("*/api/conversations", () => (db.session ? HttpResponse.json(db.conversations) : unauthorized())),

  http.post("*/api/conversations", () => {
    if (!db.session) return unauthorized();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: DEFAULT_TITLE,
      createdAt: new Date().toISOString(),
    };
    db.conversations.unshift(conversation);
    db.messages[conversation.id] = [];
    return HttpResponse.json(conversation, { status: 201 });
  }),

  http.delete("*/api/conversations/:id", ({ params }) => {
    if (!db.session) return unauthorized();
    const id = String(params.id);
    if (!db.conversations.some((c) => c.id === id)) return error(404, "Nie znaleziono rozmowy");
    db.conversations = db.conversations.filter((c) => c.id !== id);
    delete db.messages[id];
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/conversations/:id/messages", ({ params }) => {
    if (!db.session) return unauthorized();
    const messages = db.messages[String(params.id)];
    return messages ? HttpResponse.json(messages) : error(404, "Nie znaleziono rozmowy");
  }),

  http.post("*/api/conversations/:id/messages", async ({ params, request }) => {
    if (!db.session) return unauthorized();
    const id = String(params.id);
    const conversation = db.conversations.find((c) => c.id === id);
    if (!conversation) return error(404, "Nie znaleziono rozmowy");

    const { content } = (await request.json()) as { content?: string };
    const trimmed = content?.trim();
    if (!trimmed) return error(400, "Wiadomość nie może być pusta");

    const now = () => new Date().toISOString();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: id,
      role: "user",
      type: "text",
      payload: { text: trimmed },
      createdAt: now(),
    };
    const reply: Message = {
      id: crypto.randomUUID(),
      conversationId: id,
      role: "assistant",
      createdAt: now(),
      ...botReply(trimmed),
    };

    if (conversation.title === DEFAULT_TITLE) {
      conversation.title = trimmed.slice(0, MAX_TITLE_LENGTH);
    }
    db.messages[id].push(userMessage, reply);

    const result: SendMessageResult = { userMessage, reply };
    return HttpResponse.json(result, { status: 201 });
  }),
];
