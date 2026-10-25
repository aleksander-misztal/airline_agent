import type { DashboardSummary } from "../types";

// Dane przykładowe do czasu podpięcia backendu.
export const summary: DashboardSummary = {
  avios: 48250,
  milesFlown: 126840,
  flightsTaken: 37,
  upcomingBookings: [
    {
      reference: "QR7K2L",
      flightNumber: "QR123",
      from: "Warszawa (WAW)",
      to: "Doha (DOH)",
      departure: "2026-11-02T14:35:00+01:00",
      arrival: "2026-11-02T22:50:00+03:00",
      cabin: "Business",
    },
    {
      reference: "QR9M4P",
      flightNumber: "QR834",
      from: "Doha (DOH)",
      to: "Bangkok (BKK)",
      departure: "2026-12-18T02:10:00+03:00",
      arrival: "2026-12-18T12:40:00+07:00",
      cabin: "Economy",
    },
  ],
};
