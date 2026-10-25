import { useEffect, useState } from "react";
import { ConversationList } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";
import { useChatStore } from "./chatStore";

export function ChatPage() {
  const conversations = useChatStore((s) => s.conversations);
  const conversationId = useChatStore((s) => s.conversationId);
  const sending = useChatStore((s) => s.sending);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const newConversation = useChatStore((s) => s.newConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  // Na małych ekranach lista rozmów zastępuje czat (szuflada).
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
      <h1 className="sr-only">Czat</h1>

      <button
        type="button"
        aria-expanded={drawerOpen}
        aria-controls="conversations-panel"
        onClick={() => setDrawerOpen((open) => !open)}
        className="mb-3 w-fit cursor-pointer rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white lg:hidden"
      >
        Rozmowy
      </button>

      <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] gap-4">
        <aside
          id="conversations-panel"
          className={`${drawerOpen ? "flex" : "hidden"} w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200 lg:flex lg:w-72 lg:shrink-0`}
        >
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            disabled={sending}
            onSelect={(id) => {
              void selectConversation(id);
              setDrawerOpen(false);
            }}
            onNew={() => {
              newConversation();
              setDrawerOpen(false);
            }}
            onDelete={(id) => void deleteConversation(id)}
          />
        </aside>

        <section
          className={`${drawerOpen ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200`}
        >
          <ChatPanel />
        </section>
      </div>
    </div>
  );
}
