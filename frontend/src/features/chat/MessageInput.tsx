import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

const MAX_HEIGHT_PX = 160;

type MessageInputProps = {
  /** Zwrócone false oznacza błąd – wpisany tekst wraca do pola. */
  onSend: (text: string) => Promise<boolean> | boolean | void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && value.trim().length > 0;

  // Pole rośnie wraz z tekstem, do limitu.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  async function submit() {
    if (!canSend) return;
    const text = value.trim();
    setValue("");
    const ok = await onSend(text);
    if (ok === false) setValue((current) => (current === "" ? text : current));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Wiadomość"
        placeholder="Napisz wiadomość…"
        className="max-h-40 min-h-12 flex-1 resize-none rounded-3xl border border-neutral-300 bg-white px-5 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Wyślij"
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
