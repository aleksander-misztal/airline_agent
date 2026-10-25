import { useId } from "react";
import type { FlightOffer, Itinerary } from "../../api";
import { dateOf, formatDuration, formatPrice, stopsLabel, timeOf } from "../../lib/format";
import { Timeline } from "./Timeline";

type OfferCardProps = {
  offer: FlightOffer;
  expanded: boolean;
  onToggle: () => void;
  /** Kod rezerwacji, jeśli ta oferta jest już zarezerwowana. */
  reservation?: string;
  reserving?: boolean;
  error?: string;
  onReserve: () => void;
};

const legLabel = (index: number, roundTrip: boolean) => (!roundTrip ? "Lot" : index === 0 ? "Tam" : "Powrót");

function LegSummary({ leg, label }: { leg: Itinerary; label?: string }) {
  const first = leg.segments[0];
  const last = leg.segments.at(-1)!;
  const stops = leg.segments.length - 1;
  const via = leg.segments.slice(0, -1).map((s) => s.to.code);

  return (
    <div>
      {label && <p className="text-xs font-medium tracking-wide text-brand-gray uppercase">{label}</p>}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-light text-neutral-900">{timeOf(first.departure)}</span>
        <span aria-hidden="true" className="text-brand">
          →
        </span>
        <span className="text-xl font-light text-neutral-900">{timeOf(last.arrival)}</span>
      </div>
      <p className="text-sm text-neutral-700">{`${first.from.code} → ${last.to.code}`}</p>
      <p className="text-xs text-brand-gray">
        <span>{formatDuration(leg.durationMinutes)}</span>
        {" · "}
        <span>{stopsLabel(stops)}</span>
        {via.length > 0 && (
          <>
            {" · "}
            <span>{`Przez ${via.join(", ")}`}</span>
          </>
        )}
      </p>
    </div>
  );
}

export function OfferCard({ offer, expanded, onToggle, reservation, reserving = false, error, onReserve }: OfferCardProps) {
  const detailsId = useId();
  const roundTrip = offer.legs.length > 1;

  return (
    <li data-offer-id={offer.id} className="rounded-lg bg-white ring-1 ring-neutral-200 transition-shadow hover:shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-4 rounded-lg p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <div className="min-w-0 flex-1 space-y-3">
          {offer.legs.map((leg, i) => (
            <LegSummary key={i} leg={leg} label={roundTrip ? legLabel(i, true) : undefined} />
          ))}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-light text-brand">{formatPrice(offer.price.amount, offer.price.currency)}</p>
          {reservation && <p className="mt-1 text-xs font-medium text-green-700">Zarezerwowano</p>}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`mt-2 ml-auto size-5 text-brand-gray transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div id={detailsId} role="region" aria-label="Szczegóły lotu" className="border-t border-neutral-200 px-4 pt-4 pb-4">
          <div className="space-y-6">
            {offer.legs.map((leg, i) => (
              <section key={i}>
                <h3 className="mb-3 text-sm font-medium text-neutral-900">{`${legLabel(i, roundTrip)} · ${dateOf(leg.segments[0].departure)}`}</h3>
                <Timeline leg={leg} />
                <p className="mt-3 text-sm text-brand-gray">{`Czas podróży: ${formatDuration(leg.durationMinutes)}`}</p>
              </section>
            ))}
          </div>

          <div
            role="group"
            aria-label="Cena i rezerwacja"
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md bg-neutral-50 p-4"
          >
            <div>
              <p className="text-2xl font-light text-brand">{formatPrice(offer.price.amount, offer.price.currency)}</p>
              <p className="text-xs text-brand-gray">cena za wszystkich pasażerów</p>
            </div>
            {reservation ? (
              <p role="status" className="text-sm text-green-800">
                Rezerwacja potwierdzona. Kod rezerwacji: <strong className="font-medium tracking-wider">{reservation}</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={onReserve}
                disabled={reserving}
                className="cursor-pointer rounded-full bg-brand px-8 py-3 font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reserving ? "Rezerwuję…" : "Rezerwuj"}
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
