import { suggestions as defaultSuggestions, type Suggestion } from "./suggestions";

type SuggestionChipsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  /** Własne podpowiedzi; domyślnie ogólne. */
  items?: Suggestion[];
};

export function SuggestionChips({ onSelect, disabled = false, items = defaultSuggestions }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map(({ label, prompt }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="cursor-pointer rounded-full border border-brand/30 bg-white px-4 py-2 text-sm text-brand transition-colors hover:border-brand hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
