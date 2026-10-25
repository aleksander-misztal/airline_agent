import { create } from "zustand";
import { chatApi, type Message } from "../../api";

const SEND_ERROR = "Nie udało się wysłać wiadomości. Spróbuj ponownie.";
let pendingSeq = 0;

type ChatState = {
  conversationId: string | null;
  messages: Message[];
  sending: boolean;
  error: string | null;
  /** Zwraca true, gdy wiadomość poszła i przyszła odpowiedź. */
  sendMessage: (content: string) => Promise<boolean>;
  reset: () => void;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  conversationId: null,
  messages: [],
  sending: false,
  error: null,

  async sendMessage(content) {
    const text = content.trim();
    if (!text || get().sending) return false;

    // Wiadomość użytkownika widać od razu, zanim odpowie serwer.
    const pending: Message = {
      id: `pending-${++pendingSeq}`,
      conversationId: get().conversationId ?? "",
      role: "user",
      type: "text",
      payload: { text },
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, pending], sending: true, error: null }));

    try {
      let conversationId = get().conversationId;
      if (!conversationId) {
        conversationId = (await chatApi.createConversation()).id;
        set({ conversationId });
      }
      const { userMessage, reply } = await chatApi.sendMessage(conversationId, text);
      set((s) => ({
        messages: [...s.messages.filter((m) => m.id !== pending.id), userMessage, reply],
        sending: false,
      }));
      return true;
    } catch {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== pending.id),
        sending: false,
        error: SEND_ERROR,
      }));
      return false;
    }
  },

  reset() {
    set({ conversationId: null, messages: [], sending: false, error: null });
  },
}));
