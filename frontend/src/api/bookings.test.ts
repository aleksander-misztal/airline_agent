import { authApi } from "./auth";
import { bookingsApi } from "./bookings";
import { ApiError } from "./client";
import { dashboardApi } from "./dashboard";
import { flightsApi } from "./flights";
import type { FlightSearchParams } from "./types";

const search: FlightSearchParams = {
  from: "WAW",
  to: "DOH",
  departureDate: "2026-11-10",
  returnDate: null,
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "business",
};

describe("bookingsApi.create", () => {
  it("rejects requests without a session with 401", async () => {
    const err = (await bookingsApi.create({ offerId: "x", search }).catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  describe("with a session", () => {
    beforeEach(async () => {
      await authApi.login("admin", "admin");
    });

    it("books an offer and returns a reference with one booking per leg", async () => {
      const [offer] = (await flightsApi.search(search)).offers;

      const result = await bookingsApi.create({ offerId: offer.id, search });

      expect(result.reference).toMatch(/^[A-Z0-9]{6}$/);
      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0]).toMatchObject({
        reference: result.reference,
        flightNumber: offer.legs[0].segments[0].flightNumber,
        from: "Warszawa (WAW)",
        to: "Doha (DOH)",
        departure: offer.legs[0].segments[0].departure,
        arrival: offer.legs[0].segments.at(-1)!.arrival,
        cabin: "Business",
      });
    });

    it("books both legs of a round trip under one reference", async () => {
      const roundTrip = { ...search, returnDate: "2026-11-20" };
      const [offer] = (await flightsApi.search(roundTrip)).offers;

      const result = await bookingsApi.create({ offerId: offer.id, search: roundTrip });

      expect(result.bookings).toHaveLength(2);
      expect(new Set(result.bookings.map((b) => b.reference)).size).toBe(1);
      expect(result.bookings[1]).toMatchObject({ from: "Doha (DOH)", to: "Warszawa (WAW)" });
    });

    it("shows the new booking among the upcoming ones on the dashboard, in departure order", async () => {
      const before = (await dashboardApi.getSummary()).upcomingBookings;
      const [offer] = (await flightsApi.search(search)).offers;

      const { reference } = await bookingsApi.create({ offerId: offer.id, search });

      const after = (await dashboardApi.getSummary()).upcomingBookings;
      expect(after).toHaveLength(before.length + 1);
      expect(after.map((b) => b.reference)).toContain(reference);
      const instants = after.map((b) => Date.parse(b.departure));
      expect(instants).toEqual([...instants].sort((a, b) => a - b));
    });

    it("gives every booking its own reference", async () => {
      const [offer] = (await flightsApi.search(search)).offers;

      const first = await bookingsApi.create({ offerId: offer.id, search });
      const second = await bookingsApi.create({ offerId: offer.id, search });

      expect(second.reference).not.toBe(first.reference);
    });

    it("answers 404 for an offer that does not exist", async () => {
      const err = (await bookingsApi.create({ offerId: "nie-ma", search }).catch((e) => e)) as ApiError;

      expect(err.status).toBe(404);
    });

    it("answers 400 for an invalid search", async () => {
      const err = (await bookingsApi
        .create({ offerId: "x", search: { ...search, to: "WAW" } })
        .catch((e) => e)) as ApiError;

      expect(err.status).toBe(400);
    });
  });
});
