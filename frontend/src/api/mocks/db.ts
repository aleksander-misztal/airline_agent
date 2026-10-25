import type { Conversation, Message, User } from "../types";

export const MOCK_USER: User = { id: "u-1", username: "admin", displayName: "Administrator" };

type Db = {
  session: User | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
};

const emptyDb = (): Db => ({ session: null, conversations: [], messages: {} });

export let db: Db = emptyDb();

export function resetDb() {
  db = emptyDb();
}
