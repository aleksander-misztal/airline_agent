import { authApi } from "./auth";
import { ApiError } from "./client";
import { flightsApi } from "./flights";
import type { FlightSearchParams, Itinerary } from "./types";

const oneWay: FlightSearchParams = {
  from: "WAW",
  to: "DOH",
  departureDate: "2026-11-10",
  returnDate: null,
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
};
const roundTrip: FlightSearchParams = { ...oneWay, returnDate: "2026-11-20" };

const ms = (iso: string) => new Date(iso).getTime();
const minutes = (from: string, to: string) => (ms(to) - ms(from)) / 60_000;
const priceOf = async (params: FlightSearchParams) => (await flightsApi.search(params)).offers[0].price.amount;
const rejectsWith400 = async (params: unknown) => {
  const err = (await flightsApi.search(params as FlightSearchParams).catch((e) => e)) as ApiError;
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(400);
};

describe("flightsApi.search", () => {
  it("rejects requests without a session with 401", async () => {
    const err = (await flightsApi.search(oneWay).catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  describe("with a session", () => {
    beforeEach(async () => {
      await authApi.login("admin", "admin");
    });

    it("returns several offers with unique ids and a PLN price", async () => {
      const { offers } = await flightsApi.search(oneWay);

      expect(offers.length).toBeGreaterThanOrEqual(3);
      expect(offers.length).toBeLessThanOrEqual(5);
      expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length);
      for (const offer of offers) {
        expect(offer.price.currency).toBe("PLN");
        expect(offer.price.amount).toBeGreaterThan(0);
      }
    });

    it("has one leg for a one-way trip and two for a round trip", async () => {
      const single = (await flightsApi.search(oneWay)).offers;
      const both = (await flightsApi.search(roundTrip)).offers;

      expect(single.every((o) => o.legs.length === 1)).toBe(true);
      expect(both.every((o) => o.legs.length === 2)).toBe(true);
    });

    it("starts the outbound leg at the departure airport and date, and ends at the destination", async () => {
      const { offers } = await flightsApi.search(oneWay);

      for (const { legs } of offers) {
        const [leg] = legs;
        expect(leg.segments[0].from.code).toBe("WAW");
        expect(leg.segments.at(-1)!.to.code).toBe("DOH");
        expect(leg.segments[0].departure.startsWith("2026-11-10")).toBe(true);
      }
    });

    it("flies the return leg back on the return date", async () => {
      const { offers } = await flightsApi.search(roundTrip);

      for (const { legs } of offers) {
        const back = legs[1];
        expect(back.segments[0].from.code).toBe("DOH");
        expect(back.segments.at(-1)!.to.code).toBe("WAW");
        expect(back.segments[0].departure.startsWith("2026-11-20")).toBe(true);
      }
    });

    it("chains the segments of a connecting itinerary through the same airport", async () => {
      const { offers } = await flightsApi.search(roundTrip);

      const legs: Itinerary[] = offers.flatMap((o) => o.legs);
      for (const { segments } of legs) {
        for (let i = 0; i < segments.length - 1; i += 1) {
          expect(segments[i].to.code).toBe(segments[i + 1].from.code);
        }
      }
    });

    it("keeps durations consistent with the local times and time zones", async () => {
      const { offers } = await flightsApi.search(roundTrip);

      for (const { legs } of offers) {
        for (const leg of legs) {
          for (const s of leg.segments) expect(s.durationMinutes).toBe(minutes(s.departure, s.arrival));
          const first = leg.segments[0];
          const last = leg.segments.at(-1)!;
          expect(leg.durationMinutes).toBe(minutes(first.departure, last.arrival));
        }
      }
    });

    it("leaves at least 45 minutes for every connection", async () => {
      const { offers } = await flightsApi.search(roundTrip);

      const connections = offers.flatMap((o) => o.legs).filter((leg) => leg.segments.length > 1);
      expect(connections.length).toBeGreaterThan(0);
      for (const { segments } of connections) {
        for (let i = 0; i < segments.length - 1; i += 1) {
          expect(minutes(segments[i].arrival, segments[i + 1].departure)).toBeGreaterThanOrEqual(45);
        }
      }
    });

    it("gives every segment a flight number and an aircraft", async () => {
      const { offers } = await flightsApi.search(oneWay);

      for (const s of offers.flatMap((o) => o.legs).flatMap((l) => l.segments)) {
        expect(s.flightNumber).toMatch(/^QR\d{3}$/);
        expect(s.aircraft.length).toBeGreaterThan(3);
      }
    });

    it("offers both direct and connecting flights on a medium-haul route", async () => {
      const lengths = (await flightsApi.search(oneWay)).offers.map((o) => o.legs[0].segments.length);

      expect(lengths).toContain(1);
      expect(Math.max(...lengths)).toBeGreaterThan(1);
    });

    it("offers only connecting flights on an ultra-long route", async () => {
      const { offers } = await flightsApi.search({ ...oneWay, to: "SYD" });

      expect(offers.length).toBeGreaterThan(0);
      expect(offers.every((o) => o.legs[0].segments.length > 1)).toBe(true);
    });

    it("returns the same offers for the same search", async () => {
      const first = await flightsApi.search(roundTrip);
      const second = await flightsApi.search(roundTrip);

      expect(second).toEqual(first);
    });

    it("prices the cabin classes in ascending order", async () => {
      const economy = await priceOf(oneWay);
      const business = await priceOf({ ...oneWay, cabin: "business" });
      const first = await priceOf({ ...oneWay, cabin: "first" });

      expect(business).toBeGreaterThan(economy);
      expect(first).toBeGreaterThan(business);
    });

    it("prices adults, children and infants differently", async () => {
      const one = await priceOf(oneWay);
      const withInfant = await priceOf({ ...oneWay, infants: 1 });
      const withChild = await priceOf({ ...oneWay, children: 1 });
      const twoAdults = await priceOf({ ...oneWay, adults: 2 });

      expect(withInfant).toBeGreaterThan(one);
      expect(withChild).toBeGreaterThan(withInfant);
      expect(twoAdults).toBeGreaterThan(withChild);
    });

    it("prices a round trip above a one-way ticket", async () => {
      expect(await priceOf(roundTrip)).toBeGreaterThan(await priceOf(oneWay));
    });

    it.each([
      ["no departure airport", { ...oneWay, from: "" }],
      ["an unknown airport", { ...oneWay, to: "XXX" }],
      ["the same airport twice", { ...oneWay, to: "WAW" }],
      ["a malformed date", { ...oneWay, departureDate: "10.11.2026" }],
      ["a return before the departure", { ...oneWay, returnDate: "2026-11-05" }],
      ["no adults", { ...oneWay, adults: 0 }],
      ["more than 9 passengers", { ...oneWay, adults: 5, children: 5 }],
      ["more infants than adults", { ...oneWay, infants: 2 }],
      ["an unknown cabin", { ...oneWay, cabin: "premium" }],
    ])("rejects %s with 400", async (_name, params) => {
      await rejectsWith400(params);
    });
  });
});
