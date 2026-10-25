import type { Airport, Booking, Cabin, FlightOffer, FlightSearchParams, FlightSegment, Itinerary } from "../types";
import { airports } from "./airports";

// Współrzędne i strefy (stałe przesunięcia względem UTC, bez zmian czasu) do wyliczania czasów lotu i godzin lokalnych.
const COORDS: Record<string, [number, number]> = {
  WAW: [52.17, 20.97],
  DOH: [25.27, 51.61],
  KRK: [50.08, 19.78],
  DXB: [25.25, 55.36],
  LHR: [51.47, -0.45],
  FRA: [50.04, 8.56],
  CDG: [49.0, 2.55],
  JFK: [40.64, -73.78],
  BKK: [13.69, 100.75],
  SIN: [1.36, 103.99],
  GDN: [54.38, 18.47],
  KTW: [50.47, 19.08],
  WRO: [51.1, 16.89],
  POZ: [52.42, 16.83],
  AMS: [52.31, 4.76],
  IST: [41.26, 28.74],
  DEL: [28.56, 77.1],
  SYD: [-33.94, 151.18],
  NBO: [-1.32, 36.93],
  JNB: [-26.14, 28.25],
  CPT: [-33.97, 18.6],
  MLE: [4.19, 73.53],
};

const UTC_OFFSET_MIN: Record<string, number> = {
  WAW: 60, KRK: 60, GDN: 60, KTW: 60, WRO: 60, POZ: 60, FRA: 60, CDG: 60, AMS: 60,
  LHR: 0, IST: 180, DOH: 180, NBO: 180, DXB: 240, MLE: 300, DEL: 330, BKK: 420,
  SIN: 480, SYD: 660, JNB: 120, CPT: 120, JFK: -300,
};

const WIDEBODY = ["Airbus A350-900", "Boeing 787-8 Dreamliner", "Boeing 777-300ER", "Airbus A380-800"];
const NARROWBODY = ["Airbus A320", "Airbus A321", "Boeing 737-800"];
const HUBS = ["DOH", "IST", "FRA", "DXB", "AMS"];

const MAX_DIRECT_KM = 9500;
const CRUISE_KMH = 820;
const CABIN_FACTOR: Record<Cabin, number> = { economy: 1, business: 3.2, first: 5.5 };
const CABIN_LABEL: Record<Cabin, string> = { economy: "Economy", business: "Business", first: "First" };

// Ten sam zestaw szablonów dla kierunku tam i z powrotem; stops 0 = lot bezpośredni.
const TEMPLATES = [
  { stops: 0, there: "06:40", back: "10:25", priceFactor: 1.15 },
  { stops: 0, there: "14:35", back: "17:10", priceFactor: 1.25 },
  { stops: 1, there: "09:15", back: "08:05", priceFactor: 0.9, hub: 0 },
  { stops: 1, there: "11:50", back: "13:30", priceFactor: 0.85, hub: 1 },
  { stops: 1, there: "19:20", back: "21:15", priceFactor: 0.8, hub: 0 },
];

const byCode = (code: string) => airports.find((a) => a.code === code);
const pad = (n: number) => String(n).padStart(2, "0");

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function distanceKm(a: string, b: string) {
  const [lat1, lon1] = COORDS[a];
  const [lat2, lon2] = COORDS[b];
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const flightMinutes = (a: string, b: string) => Math.round(((distanceKm(a, b) / CRUISE_KMH) * 60 + 35) / 5) * 5;

function localIso(utcMs: number, offsetMin: number) {
  const d = new Date(utcMs + offsetMin * 60_000);
  const abs = Math.abs(offsetMin);
  const sign = offsetMin >= 0 ? "+" : "-";
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `${date}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function utcFromLocal(date: string, time: string, offsetMin: number) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) - offsetMin * 60_000;
}

function buildLeg(route: Airport[], date: string, departAt: string, seed: string): Itinerary {
  const segments: FlightSegment[] = [];
  const firstDeparture = utcFromLocal(date, departAt, UTC_OFFSET_MIN[route[0].code]);
  let clock = firstDeparture;

  for (let i = 0; i < route.length - 1; i += 1) {
    const from = route[i];
    const to = route[i + 1];
    const duration = flightMinutes(from.code, to.code);
    const key = `${from.code}${to.code}${seed}`;
    const fleet = distanceKm(from.code, to.code) > 6000 ? WIDEBODY : NARROWBODY;
    const arrival = clock + duration * 60_000;

    segments.push({
      flightNumber: `QR${100 + (hash(key) % 900)}`,
      aircraft: fleet[hash(`${key}-aircraft`) % fleet.length],
      from,
      to,
      departure: localIso(clock, UTC_OFFSET_MIN[from.code]),
      arrival: localIso(arrival, UTC_OFFSET_MIN[to.code]),
      durationMinutes: duration,
    });

    const layover = 80 + ((hash(`${key}-layover`) + i * 37) % 120);
    clock = arrival + layover * 60_000;
  }

  const lastArrival = utcFromLocal(
    segments.at(-1)!.arrival.slice(0, 10),
    segments.at(-1)!.arrival.slice(11, 16),
    UTC_OFFSET_MIN[segments.at(-1)!.to.code],
  );
  return { segments, durationMinutes: (lastArrival - firstDeparture) / 60_000 };
}

/** Deterministyczne oferty: te same parametry zawsze dają te same identyfikatory i ceny. */
export function generateOffers(params: FlightSearchParams): FlightOffer[] {
  const from = byCode(params.from)!;
  const to = byCode(params.to)!;
  const km = distanceKm(from.code, to.code);
  const hubs = HUBS.map(byCode).filter((a): a is Airport => !!a && a.code !== from.code && a.code !== to.code);
  const passengers = params.adults + params.children * 0.75 + params.infants * 0.1;
  const basePerAdult = Math.round(km * 0.12 + 180);
  const roundTrip = !!params.returnDate;

  return TEMPLATES.flatMap((template, index): FlightOffer[] => {
    if (template.stops === 0 && km > MAX_DIRECT_KM) return [];
    const via = template.stops ? [hubs[template.hub!]] : [];

    const legs = [buildLeg([from, ...via, to], params.departureDate, template.there, `t${index}`)];
    if (params.returnDate) {
      legs.push(buildLeg([to, ...via, from], params.returnDate, template.back, `b${index}`));
    }

    const amount = Math.round(
      basePerAdult * template.priceFactor * CABIN_FACTOR[params.cabin] * passengers * (roundTrip ? 1.8 : 1),
    );
    return [
      {
        id: `${params.from}${params.to}-${params.departureDate}-${params.returnDate ?? "ow"}-${params.cabin}-${index}`,
        price: { amount, currency: "PLN" },
        legs,
      },
    ];
  });
}

export function bookingsFor(offer: FlightOffer, cabin: Cabin, reference: string): Booking[] {
  return offer.legs.map((leg) => {
    const first = leg.segments[0];
    const last = leg.segments.at(-1)!;
    return {
      reference,
      flightNumber: first.flightNumber,
      from: `${first.from.city} (${first.from.code})`,
      to: `${last.to.city} (${last.to.code})`,
      departure: first.departure,
      arrival: last.arrival,
      cabin: CABIN_LABEL[cabin],
    };
  });
}

type Validation = { ok: true; params: FlightSearchParams } | { ok: false; error: string };

const isoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const count = (value: unknown) =>
  typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;

/** Wspólna walidacja parametrów wyszukiwania (zapytanie i rezerwacja). */
export function validateSearch(input: Record<string, unknown>): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  const { from, to, departureDate, cabin } = input;

  for (const code of [from, to]) {
    if (typeof code !== "string" || !code) return fail("Podaj lotnisko wylotu i przylotu");
    if (!byCode(code)) return fail(`Nieznane lotnisko: ${code}`);
  }
  if (from === to) return fail("Lotnisko przylotu musi być inne niż wylotu");

  if (!isoDate(departureDate)) return fail("Nieprawidłowa data wylotu");
  const returnDate = input.returnDate ? input.returnDate : null;
  if (returnDate !== null) {
    if (!isoDate(returnDate)) return fail("Nieprawidłowa data powrotu");
    if (returnDate < departureDate) return fail("Powrót nie może być wcześniej niż wylot");
  }

  const adults = count(input.adults);
  const children = count(input.children);
  const infants = count(input.infants);
  if (![adults, children, infants].every(Number.isInteger) || children < 0 || infants < 0) {
    return fail("Nieprawidłowa liczba pasażerów");
  }
  if (adults < 1) return fail("Podaj co najmniej jednego dorosłego");
  if (adults + children + infants > 9) return fail("Maksymalnie 9 pasażerów");
  if (infants > adults) return fail("Niemowląt nie może być więcej niż dorosłych");

  if (typeof cabin !== "string" || !(cabin in CABIN_FACTOR)) return fail("Nieprawidłowa klasa podróży");

  return {
    ok: true,
    params: {
      from: from as string,
      to: to as string,
      departureDate,
      returnDate: returnDate as string | null,
      adults,
      children,
      infants,
      cabin: cabin as Cabin,
    },
  };
}
