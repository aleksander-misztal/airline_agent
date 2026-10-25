export function TypingIndicator() {
  return (
    <div role="status" aria-label="Asystent pisze…" className="mt-4 flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3">
      {[0, 150, 300].map((delayMs) => (
        <span
          key={delayMs}
          style={{ animationDelay: `${delayMs}ms` }}
          className="size-2 animate-bounce rounded-full bg-brand-gray"
        />
      ))}
    </div>
  );
}
