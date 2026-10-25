import { create } from "zustand";
import { chatApi, type Conversation, type Message } from "../../api";

const SEND_ERROR = "Nie udało się wysłać wiadomości. Spróbuj ponownie.";
const LIST_ERROR = "Nie udało się wczytać listy rozmów.";
const LOAD_ERROR = "Nie udało się wczytać rozmowy.";
const DELETE_ERROR = "Nie udało się usunąć rozmowy.";
let pendingSeq = 0;

type ChatState = {
  conversations: Conversation[];
  /** Aktywna rozmowa; null = nowa, zakładana przy pierwszej wiadomości. */
  conversationId: string | null;
  messages: Message[];
  sending: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  newConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  /** Zwraca true, gdy wiadomość poszła i przyszła odpowiedź. */
  sendMessage: (content: string) => Promise<boolean>;
  dismissError: () => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  conversationId: null,
  messages: [],
  sending: false,
  error: null,

  async loadConversations() {
    try {
      set({ conversations: await chatApi.listConversations() });
    } catch {
      set({ error: LIST_ERROR });
    }
  },

  async selectConversation(id) {
    if (get().sending || id === get().conversationId) return;

    const previous = { conversationId: get().conversationId, messages: get().messages };
    set({ conversationId: id, messages: [], error: null });
    try {
      const messages = await chatApi.listMessages(id);
      // Odpowiedź na wcześniejszy wybór (wolniejsza niż późniejszy) jest ignorowana.
      if (get().conversationId === id) set({ messages });
    } catch {
      if (get().conversationId === id) set({ ...previous, error: LOAD_ERROR });
    }
  },

  newConversation() {
    if (get().sending) return;
    set({ conversationId: null, messages: [], error: null });
  },

  async deleteConversation(id) {
    try {
      await chatApi.deleteConversation(id);
    } catch {
      set({ error: DELETE_ERROR });
      return;
    }
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      ...(s.conversationId === id ? { conversationId: null, messages: [] } : {}),
    }));
  },

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
      await get().loadConversations();
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

  dismissError() {
    set({ error: null });
  },

  reset() {
    set({ conversations: [], conversationId: null, messages: [], sending: false, error: null });
  },
}));
