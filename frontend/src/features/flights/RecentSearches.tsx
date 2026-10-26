import { dateOf } from "../../lib/format";
import { todayISO } from "../../lib/date";
import { describePassengers } from "../../lib/passengers";
import { airportLabel } from "./AirportField";
import { useRecentSearchesStore } from "./recentSearchesStore";
import { cabinLabels, type SearchCriteria } from "./types";

type RecentSearchesProps = {
  /** Wywoływane po kliknięciu pozycji; strona wypełnia formularz i uruchamia wyszukiwanie. */
  onRecall: (criteria: SearchCriteria) => void;
  /** Dzisiejsza data (YYYY-MM-DD); do testów. */
  today?: string;
};

export function RecentSearches({ onRecall, today = todayISO() }: RecentSearchesProps) {
  const items = useRecentSearchesStore((s) => s.items);
  const remove = useRecentSearchesStore((s) => s.remove);
  const clear = useRecentSearchesStore((s) => s.clear);

  if (items.length === 0) return null;

  return (
    <section aria-label="Ostatnie wyszukiwania" className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-medium tracking-[0.15em] text-brand-gray uppercase">Ostatnie wyszukiwania</h2>
        <button
          type="button"
          onClick={clear}
          className="cursor-pointer text-sm text-brand-gray underline-offset-2 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Wyczyść historię
        </button>
      </div>

      <ul className="mt-3 divide-y divide-neutral-200">
        {items.map(({ id, criteria }) => {
          const route = `${airportLabel(criteria.from)} → ${airportLabel(criteria.to)}`;
          const dates = criteria.returnDate
            ? `${dateOf(criteria.departureDate)} – ${dateOf(criteria.returnDate)}`
            : dateOf(criteria.departureDate);
          const expired = criteria.departureDate < today;

          return (
            <li key={id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRecall(criteria)}
                className="min-w-0 flex-1 cursor-pointer rounded py-3 text-left transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span className="flex flex-wrap items-center gap-x-3">
                  <span className="font-medium text-neutral-900">{route}</span>
                  {expired && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Daty minęły</span>
                  )}
                </span>
                <span className="block text-sm text-brand-gray">
                  {`${dates} · ${describePassengers(criteria.passengers)} · ${cabinLabels[criteria.cabin]}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Usuń z historii: ${route}`}
                className="shrink-0 cursor-pointer rounded p-2 text-brand-gray hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
