import type { Conversation } from "../../api";

type ConversationListProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  disabled = false,
}: ConversationListProps) {
  return (
    <nav aria-label="Rozmowy" className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-neutral-200 p-3">
        <button
          type="button"
          onClick={onNew}
          disabled={disabled}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nowa rozmowa
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-brand-gray">Brak zapisanych rozmów</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {conversations.map(({ id, title }) => {
            const active = id === activeId;
            return (
              <li
                key={id}
                className={`group flex items-center rounded-md ${active ? "bg-brand-50" : "hover:bg-neutral-100"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  disabled={disabled}
                  aria-current={active ? "true" : undefined}
                  className={`min-w-0 flex-1 cursor-pointer truncate px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed ${
                    active ? "font-medium text-brand" : "text-neutral-800"
                  }`}
                >
                  {title}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(id)}
                  disabled={disabled}
                  aria-label={`Usuń rozmowę: ${title}`}
                  className="mr-1 shrink-0 cursor-pointer rounded p-2 text-brand-gray opacity-60 transition-opacity hover:text-brand hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
