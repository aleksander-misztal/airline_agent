import type { Conversation, Message, User } from "../types";

export const MOCK_USER: User = { id: "u-1", username: "admin", displayName: "Administrator" };

const SESSION_KEY = "mock-session";

type Db = {
  session: User | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
};

// Sesja mocka przeżywa odświeżenie strony (jak ciasteczko); reszta danych żyje w pamięci.
function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User | null) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // brak localStorage – sesja tylko w pamięci
  }
}

const createDb = (): Db => {
  let session = loadSession();
  return {
    get session() {
      return session;
    },
    set session(user) {
      session = user;
      saveSession(user);
    },
    conversations: [],
    messages: {},
  };
};

export let db: Db = createDb();

export function resetDb() {
  saveSession(null);
  db = createDb();
}
