import type { ComponentType } from "react";
import type { FlightCardPayload, Message } from "../../api";

type RendererProps<T extends Message["type"]> = { message: Extract<Message, { type: T }> };

function TextMessage({ message }: RendererProps<"text">) {
  return <p className="whitespace-pre-wrap">{message.payload.text}</p>;
}

// Godzina i data są wzięte wprost z ISO, czyli w czasie lokalnym lotniska (bez przeliczania stref).
const timeOf = (iso: string) => iso.slice(11, 16);
const dateOf = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

function Endpoint({ place, iso }: { place: string; iso: FlightCardPayload["departure"] }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-2xl font-light text-neutral-900">{timeOf(iso)}</p>
      <p className="text-xs text-brand-gray">{dateOf(iso)}</p>
      <p className="mt-1 text-sm font-medium text-neutral-800">{place}</p>
    </div>
  );
}

function FlightCardMessage({ message }: RendererProps<"flight_card">) {
  const { flightNumber, from, to, departure, arrival, status, gate } = message.payload;

  return (
    <article className="w-72 overflow-hidden rounded-lg bg-white text-neutral-900 ring-1 ring-neutral-200 sm:w-96">
      <header className="flex items-center justify-between bg-brand px-4 py-2 text-white">
        <span className="font-medium tracking-wide">{flightNumber}</span>
        <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs">{status}</span>
      </header>
      <div className="flex items-start gap-3 px-4 py-4">
        <Endpoint place={from} iso={departure} />
        <span aria-hidden="true" className="pt-2 text-brand">
          →
        </span>
        <Endpoint place={to} iso={arrival} />
      </div>
      <dl className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-sm">
        <dt className="text-brand-gray">Brama</dt>
        <dd className="font-medium">{gate}</dd>
      </dl>
    </article>
  );
}

// Nowy rodzaj wiadomości = nowy wariant w api/types.ts + wpis tutaj (TypeScript pilnuje kompletności).
export const messageRenderers: { [T in Message["type"]]: ComponentType<RendererProps<T>> } = {
  text: TextMessage,
  flight_card: FlightCardMessage,
};
