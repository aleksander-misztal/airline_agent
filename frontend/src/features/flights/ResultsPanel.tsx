import { offersLabel } from "../../lib/format";
import { OfferCard } from "./OfferCard";
import { SearchSummary } from "./SearchSummary";
import { selectVisibleOffers, useFlightSearchStore, type SortKey } from "./flightSearchStore";

const sortLabels: Record<SortKey, string> = {
  price: "Najtańsze",
  duration: "Najkrótsze",
  departure: "Najwcześniejszy wylot",
};

/** Prawe okno wyszukiwarki: kryteria, sortowanie i filtr oraz lista ofert rozwijanych w miejscu. */
export function ResultsPanel() {
  const criteria = useFlightSearchStore((s) => s.criteria);
  const status = useFlightSearchStore((s) => s.status);
  const error = useFlightSearchStore((s) => s.error);
  const offers = useFlightSearchStore((s) => s.offers);
  const sort = useFlightSearchStore((s) => s.sort);
  const directOnly = useFlightSearchStore((s) => s.directOnly);
  const expandedId = useFlightSearchStore((s) => s.expandedId);
  const reservations = useFlightSearchStore((s) => s.reservations);
  const reservingId = useFlightSearchStore((s) => s.reservingId);
  const reserveError = useFlightSearchStore((s) => s.reserveError);
  const { search, setSort, setDirectOnly, toggleOffer, reserve } = useFlightSearchStore.getState();

  if (!criteria) return null;
  const visible = selectVisibleOffers({ offers, sort, directOnly });

  return (
    <section aria-label="Lista lotów" className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-8">
      <SearchSummary criteria={criteria} />

      {status === "loading" && (
        <div role="status" className="flex items-center justify-center gap-3 py-16 text-brand-gray">
          <span className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Szukam lotów…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void search(criteria)}
            className="cursor-pointer rounded-full border border-brand px-6 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {offers.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="text-sm text-neutral-700">{`Znaleziono ${offersLabel(visible.length)}`}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <label className="flex items-center gap-2 text-neutral-700">
                  Sortuj
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 outline-none focus:border-brand"
                  >
                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                      <option key={key} value={key}>
                        {sortLabels[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                  <input
                    type="checkbox"
                    checked={directOnly}
                    onChange={(e) => setDirectOnly(e.target.checked)}
                    className="size-4 accent-brand"
                  />
                  Tylko bezpośrednie
                </label>
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <p className="py-12 text-center text-brand-gray">Brak lotów spełniających kryteria</p>
          ) : (
            <ul aria-label="Wyniki wyszukiwania" className="mt-4 space-y-3">
              {visible.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  expanded={expandedId === offer.id}
                  onToggle={() => toggleOffer(offer.id)}
                  reservation={reservations[offer.id]}
                  reserving={reservingId === offer.id}
                  error={reserveError?.offerId === offer.id ? reserveError.message : undefined}
                  onReserve={() => void reserve(offer.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
