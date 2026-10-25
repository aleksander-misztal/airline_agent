import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { brand } from "../../config/brand";
import { ChatPanel } from "../chat/ChatPanel";
import { useChatStore } from "../chat/chatStore";
import { suggestionsFor } from "./agentSuggestions";

const headerButtonClass =
  "cursor-pointer rounded-full p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white";

/** Okrągła ikona w rogu ekranu i małe okno czatu; nie pojawia się na stronie Asystent (tam jest pełny czat). */
export function AgentLauncher() {
  const { pathname } = useLocation();
  const onAssistantPage = pathname.startsWith("/chat");
  const newConversation = useChatStore((s) => s.newConversation);

  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  // Pierwsze otwarcie po wizycie w zakładce Asystent zaczyna nową rozmowę; kolejne ją kontynuują.
  const started = useRef(false);

  useEffect(() => {
    if (onAssistantPage) {
      setOpen(false);
      started.current = false;
    }
  }, [onAssistantPage]);

  useEffect(() => {
    if (wasOpen.current && !open) iconRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (onAssistantPage) return null;

  function openPopup() {
    if (!started.current) {
      newConversation();
      started.current = true;
    }
    setOpen(true);
  }

  function startNewConversation() {
    newConversation();
    dialogRef.current?.querySelector("textarea")?.focus();
  }

  if (!open) {
    return (
      <button
        ref={iconRef}
        type="button"
        onClick={openPopup}
        aria-label="Otwórz asystenta"
        aria-haspopup="dialog"
        className="fixed right-4 bottom-4 z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-brand shadow-lg ring-4 ring-white/80 transition-transform hover:scale-105 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:right-6 sm:bottom-6 sm:size-16"
      >
        <img src={brand.logo.oryx} alt="" className="size-9 brightness-0 invert sm:size-10" />
      </button>
    );
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Asystent"
      className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-neutral-200 motion-safe:animate-popup-in sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[36rem] sm:max-h-[calc(100dvh-3rem)] sm:w-[25rem] sm:rounded-2xl"
    >
      <header className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
        <img src={brand.logo.oryx} alt="" className="size-8 rounded-full bg-white/15 p-1 brightness-0 invert" />
        <h2 className="flex-1 text-base font-medium">{brand.assistantName}</h2>
        <button
          type="button"
          onClick={startNewConversation}
          aria-label="Nowa rozmowa"
          title="Nowa rozmowa"
          className={headerButtonClass}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Zamknij asystenta"
          title="Zamknij"
          className={headerButtonClass}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <ChatPanel suggestions={suggestionsFor(pathname)} compact autoFocusInput />
    </div>
  );
}
