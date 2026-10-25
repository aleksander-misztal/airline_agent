import type { Airport, FlightOffer, FlightSegment, Itinerary } from "../api";
import type { SearchCriteria } from "../features/flights/types";

export const WAW: Airport = { code: "WAW", city: "Warszawa", country: "Polska", name: "Warsaw Chopin Airport" };
export const DOH: Airport = { code: "DOH", city: "Doha", country: "Katar", name: "Hamad International Airport" };
export const IST: Airport = { code: "IST", city: "Stambuł", country: "Turcja", name: "Istanbul Airport" };

const segment = (s: Omit<FlightSegment, "durationMinutes"> & { durationMinutes: number }): FlightSegment => s;

// WAW 14:35 (+01:00) → DOH 22:50 (+03:00) = 6 h 15 min
const outboundDirect: Itinerary = {
  durationMinutes: 375,
  segments: [
    segment({
      flightNumber: "QR123",
      aircraft: "Airbus A350-900",
      from: WAW,
      to: DOH,
      departure: "2026-11-02T14:35:00+01:00",
      arrival: "2026-11-02T22:50:00+03:00",
      durationMinutes: 375,
    }),
  ],
};

// DOH 03:05 (+03:00) → WAW 08:20 (+01:00) = 7 h 15 min
const returnDirect: Itinerary = {
  durationMinutes: 435,
  segments: [
    segment({
      flightNumber: "QR124",
      aircraft: "Boeing 777-300ER",
      from: DOH,
      to: WAW,
      departure: "2026-11-12T03:05:00+03:00",
      arrival: "2026-11-12T08:20:00+01:00",
      durationMinutes: 435,
    }),
  ],
};

// WAW 06:10 → IST 10:25 (2 h 15 min), przesiadka 2 h 15 min, IST 12:40 → DOH 16:05 (3 h 25 min); razem 7 h 55 min
const outboundConnecting: Itinerary = {
  durationMinutes: 475,
  segments: [
    segment({
      flightNumber: "QR271",
      aircraft: "Airbus A320",
      from: WAW,
      to: IST,
      departure: "2026-11-02T06:10:00+01:00",
      arrival: "2026-11-02T10:25:00+03:00",
      durationMinutes: 135,
    }),
    segment({
      flightNumber: "QR242",
      aircraft: "Boeing 787-8 Dreamliner",
      from: IST,
      to: DOH,
      departure: "2026-11-02T12:40:00+03:00",
      arrival: "2026-11-02T16:05:00+03:00",
      durationMinutes: 205,
    }),
  ],
};

export const directOffer: FlightOffer = {
  id: "o-direct",
  price: { amount: 2450, currency: "PLN" },
  legs: [outboundDirect],
};

export const connectingOffer: FlightOffer = {
  id: "o-connecting",
  price: { amount: 1890, currency: "PLN" },
  legs: [outboundConnecting],
};

export const roundTripOffer: FlightOffer = {
  id: "o-round",
  price: { amount: 4100, currency: "PLN" },
  legs: [outboundDirect, returnDirect],
};

export const criteria: SearchCriteria = {
  tripType: "round_trip",
  from: WAW,
  to: DOH,
  departureDate: "2026-11-10",
  returnDate: "2026-11-20",
  passengers: { adults: 2, children: 1, infants: 0 },
  cabin: "economy",
};
