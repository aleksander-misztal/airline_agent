import { request } from "./client";
import type { Conversation, Message, SendMessageResult } from "./types";

export const chatApi = {
  listConversations: () => request<Conversation[]>("/api/conversations"),

  createConversation: () => request<Conversation>("/api/conversations", { method: "POST" }),

  deleteConversation: (id: string) =>
    request<void>(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listMessages: (conversationId: string) =>
    request<Message[]>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    request<SendMessageResult>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: { content },
    }),
};
