import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { PageLoader } from "../../components/PageLoader";
import { dateOf, formatNumber, timeOf } from "../../lib/format";
import { useAuthStore } from "../auth/authStore";
import { useDashboardStore } from "./dashboardStore";

type TileProps = { id: string; title: string; className?: string; children: ReactNode };

function Tile({ id, title, className = "", children }: TileProps) {
  return (
    <section
      aria-labelledby={id}
      className={`rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200 ${className}`}
    >
      <h2 id={id} className="text-xs font-medium tracking-[0.15em] text-brand-gray uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatTile({ id, title, value, hint }: { id: string; title: string; value: number; hint: string }) {
  return (
    <Tile id={id} title={title}>
      <p className="mt-3 text-4xl font-light text-brand">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-brand-gray">{hint}</p>
    </Tile>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const status = useDashboardStore((s) => s.status);
  const summary = useDashboardStore((s) => s.summary);
  const error = useDashboardStore((s) => s.error);
  const load = useDashboardStore((s) => s.load);

  useEffect(() => {
    if (status === "idle") void load();
  }, [status, load]);

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="cursor-pointer rounded-full border border-brand px-6 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (!summary) return <PageLoader />;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-light text-brand">Dzień dobry, {user?.displayName}</h1>
      <p className="mt-1 text-brand-gray">Twoje konto w skrócie.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile id="tile-avios" title="Avios" value={summary.avios} hint="punkty milowe" />
        <StatTile id="tile-miles" title="Przebyte mile" value={summary.milesFlown} hint="mil w powietrzu" />
        <StatTile id="tile-flights" title="Odbyte loty" value={summary.flightsTaken} hint="lotów łącznie" />

        <Tile id="tile-bookings" title="Nadchodzące rezerwacje" className="sm:col-span-2">
          {summary.upcomingBookings.length === 0 ? (
            <p className="mt-4 text-brand-gray">Brak nadchodzących rezerwacji</p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200">
              {summary.upcomingBookings.map((b) => (
                <li key={b.reference} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">{`${b.from} → ${b.to}`}</p>
                    <p className="text-sm text-brand-gray">{`${dateOf(b.departure)} · ${timeOf(b.departure)} · ${b.cabin}`}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-brand">{b.flightNumber}</p>
                    <p className="text-brand-gray">{b.reference}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile id="tile-search" title="Wyszukiwarka lotów" className="flex flex-col">
          <p className="mt-3 flex-1 text-brand-gray">Znajdź i zarezerwuj kolejny lot.</p>
          <Link
            to="/flights"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Wyszukaj loty
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </Tile>
      </div>
    </div>
  );
}
