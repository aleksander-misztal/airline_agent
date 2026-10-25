import type { ReactNode } from "react";
import type { FlightSegment, Itinerary } from "../../api";
import { dateOf, formatDuration, timeOf } from "../../lib/format";
import { airportLabel } from "./AirportField";

const minutesBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 60_000;

function Dot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-brand ${filled ? "bg-brand" : "bg-white"}`}
    />
  );
}

function Stop({ airport, iso, filled }: { airport: FlightSegment["from"]; iso: string; filled: boolean }) {
  return (
    <li className="relative flex gap-4 pb-1 pl-6">
      <Dot filled={filled} />
      <div className="w-20 shrink-0">
        <p className="text-lg leading-tight font-medium text-neutral-900">{timeOf(iso)}</p>
        <p className="text-xs text-brand-gray">{dateOf(iso)}</p>
      </div>
      <div className="min-w-0">
        <p className="leading-tight font-medium text-neutral-900">{airportLabel(airport)}</p>
        <p className="text-xs text-brand-gray">{airport.name}</p>
      </div>
    </li>
  );
}

function Flight({ segment }: { segment: FlightSegment }) {
  return (
    <li className="py-3 pl-6">
      <div className="rounded-md bg-brand-50 px-3 py-2 text-sm">
        <p className="font-medium text-brand">{`${segment.flightNumber} · ${segment.aircraft}`}</p>
        <p className="text-brand-gray">{formatDuration(segment.durationMinutes)}</p>
      </div>
    </li>
  );
}

function Layover({ minutes }: { minutes: number }) {
  return (
    <li className="py-3 pl-6">
      <span className="inline-block rounded-full border border-dashed border-brand-gray px-3 py-1 text-xs font-medium text-brand-gray">
        {`Przesiadka ${formatDuration(minutes)}`}
      </span>
    </li>
  );
}

/** Pionowa oś czasu jednego kierunku: lotnisko, data i godzina, lot (numer, samolot, czas) i przesiadki. */
export function Timeline({ leg }: { leg: Itinerary }) {
  const { segments } = leg;
  const rows: ReactNode[] = [];

  segments.forEach((segment, i) => {
    rows.push(<Stop key={`dep-${i}`} airport={segment.from} iso={segment.departure} filled={i === 0} />);
    rows.push(<Flight key={`flight-${i}`} segment={segment} />);
    rows.push(<Stop key={`arr-${i}`} airport={segment.to} iso={segment.arrival} filled={i === segments.length - 1} />);
    const next = segments[i + 1];
    if (next) rows.push(<Layover key={`layover-${i}`} minutes={minutesBetween(segment.arrival, next.departure)} />);
  });

  return (
    <ol aria-label="Przebieg lotu" className="ml-1.5 border-l-2 border-brand/40">
      {rows}
    </ol>
  );
}
