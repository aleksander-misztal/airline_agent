import { brand } from "../../config/brand";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { SuggestionChips } from "./SuggestionChips";
import { useChatStore } from "./chatStore";
import { suggestions as defaultSuggestions, type Suggestion } from "./suggestions";

type ChatPanelProps = {
  suggestions?: Suggestion[];
  /** Mniejszy ekran powitalny (okno asystenta). */
  compact?: boolean;
  autoFocusInput?: boolean;
};

/** Wątek, ekran powitalny, komunikat o błędzie i pole wpisywania – wspólne dla strony Asystent i okna asystenta. */
export function ChatPanel({ suggestions = defaultSuggestions, compact = false, autoFocusInput = false }: ChatPanelProps) {
  const messages = useChatStore((s) => s.messages);
  const sending = useChatStore((s) => s.sending);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const dismissError = useChatStore((s) => s.dismissError);

  return (
    <>
      {messages.length > 0 ? (
        <MessageList messages={messages} sending={sending} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8 text-center">
          <img src={brand.logo.oryx} alt="" className={compact ? "size-14" : "size-20"} />
          <div>
            <h2 className={`font-light text-brand ${compact ? "text-2xl" : "text-3xl"}`}>Dzień dobry!</h2>
            <p className={`mt-1 text-brand-gray ${compact ? "text-base" : "text-lg"}`}>W czym mogę pomóc?</p>
          </div>
          <SuggestionChips items={suggestions} onSelect={(prompt) => void sendMessage(prompt)} disabled={sending} />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mx-4 mb-2 flex items-start justify-between gap-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Zamknij komunikat"
            className="shrink-0 cursor-pointer rounded p-0.5 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-800"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="border-t border-neutral-200 p-3">
        <MessageInput onSend={sendMessage} disabled={sending} autoFocus={autoFocusInput} />
      </div>
    </>
  );
}
