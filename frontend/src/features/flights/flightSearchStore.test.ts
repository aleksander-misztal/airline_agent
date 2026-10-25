import { delay, http, HttpResponse } from "msw";
import { authApi, type FlightOffer } from "../../api";
import { server } from "../../api/mocks/server";
import { criteria, directOffer } from "../../test/fixtures";
import { useDashboardStore } from "../dashboard/dashboardStore";
import { selectVisibleOffers, useFlightSearchStore } from "./flightSearchStore";

const state = () => useFlightSearchStore.getState();
const ids = () => selectVisibleOffers(state()).map((o) => o.id);
const totalDuration = (o: FlightOffer) => o.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
const firstDeparture = (o: FlightOffer) => new Date(o.legs[0].segments[0].departure).getTime();
const sydney = { code: "SYD", city: "Sydney", country: "Australia", name: "Kingsford Smith Airport" };

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

describe("flightSearchStore – search", () => {
  it("starts idle", () => {
    expect(state()).toMatchObject({
      status: "idle",
      criteria: null,
      offers: [],
      sort: "price",
      directOnly: false,
      expandedId: null,
      reservations: {},
      reservingId: null,
      reserveError: null,
    });
  });

  it("is loading right after the search starts, then ready with offers", async () => {
    const pending = state().search(criteria);

    expect(state().status).toBe("loading");
    expect(state().criteria).toEqual(criteria);
    await pending;

    expect(state().status).toBe("ready");
    expect(state().offers.length).toBeGreaterThanOrEqual(3);
  });

  it("stores an error when the search fails and recovers on retry", async () => {
    server.use(http.get("*/api/flights/search", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));

    await state().search(criteria);
    expect(state()).toMatchObject({
      status: "error",
      offers: [],
      error: "Nie udało się wyszukać lotów. Spróbuj ponownie.",
    });

    await state().search(criteria);
    expect(state()).toMatchObject({ status: "ready", error: null });
  });

  it("keeps the newest search when an older one answers later", async () => {
    server.use(
      http.get("*/api/flights/search", async ({ request }) => {
        const cabin = new URL(request.url).searchParams.get("cabin");
        if (cabin === "first") await delay(100);
        return HttpResponse.json({ offers: [{ ...directOffer, id: `offer-${cabin}` }] });
      }),
    );

    const slow = state().search({ ...criteria, cabin: "first" });
    await state().search({ ...criteria, cabin: "economy" });
    await slow;

    expect(state().offers.map((o) => o.id)).toEqual(["offer-economy"]);
    expect(state().criteria?.cabin).toBe("economy");
  });

  it("collapses the open offer when searching again", async () => {
    await state().search(criteria);
    state().toggleOffer(state().offers[0].id);

    await state().search(criteria);

    expect(state().expandedId).toBeNull();
  });
});

describe("flightSearchStore – sorting and filtering", () => {
  beforeEach(async () => {
    await state().search(criteria);
  });

  it("sorts by price by default", () => {
    const prices = selectVisibleOffers(state()).map((o) => o.price.amount);

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts by the shortest total travel time", () => {
    state().setSort("duration");

    const durations = selectVisibleOffers(state()).map(totalDuration);
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    expect(ids()).not.toEqual(selectVisibleOffers({ ...state(), sort: "price" }).map((o) => o.id));
  });

  it("sorts by the earliest departure", () => {
    state().setSort("departure");

    const times = selectVisibleOffers(state()).map(firstDeparture);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("keeps only direct flights in both directions when asked to", () => {
    state().setDirectOnly(true);

    const visible = selectVisibleOffers(state());
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(state().offers.length);
    expect(visible.every((o) => o.legs.every((leg) => leg.segments.length === 1))).toBe(true);
  });

  it("shows nothing when no direct flight exists but offers do", async () => {
    await state().search({ ...criteria, to: sydney });

    state().setDirectOnly(true);

    expect(state().offers.length).toBeGreaterThan(0);
    expect(selectVisibleOffers(state())).toEqual([]);
  });
});

describe("flightSearchStore – expanding", () => {
  it("keeps one offer open at a time and closes it on a second click", async () => {
    await state().search(criteria);
    const [a, b] = state().offers.map((o) => o.id);

    state().toggleOffer(a);
    expect(state().expandedId).toBe(a);
    state().toggleOffer(b);
    expect(state().expandedId).toBe(b);
    state().toggleOffer(b);
    expect(state().expandedId).toBeNull();
  });
});

describe("flightSearchStore – reserving", () => {
  it("reserves an offer, remembers the code and refreshes the dashboard", async () => {
    await state().search(criteria);
    const [offer] = state().offers;

    const ok = await state().reserve(offer.id);

    expect(ok).toBe(true);
    const reference = state().reservations[offer.id];
    expect(reference).toMatch(/^[A-Z0-9]{6}$/);
    expect(state()).toMatchObject({ reservingId: null, reserveError: null });
    await vi.waitFor(() =>
      expect(useDashboardStore.getState().summary?.upcomingBookings.map((b) => b.reference)).toContain(reference),
    );
  });

  it("is busy with that offer while the request is in flight", async () => {
    await state().search(criteria);
    const [offer] = state().offers;
    server.use(
      http.post("*/api/bookings", async () => {
        await delay(50);
        return HttpResponse.json({ reference: "ABC123", bookings: [] }, { status: 201 });
      }),
    );

    const pending = state().reserve(offer.id);

    expect(state().reservingId).toBe(offer.id);
    await pending;
    expect(state().reservations[offer.id]).toBe("ABC123");
  });

  it("reports an error for that offer when the reservation fails", async () => {
    await state().search(criteria);
    const [offer] = state().offers;
    server.use(http.post("*/api/bookings", () => HttpResponse.json({ error: "x" }, { status: 500 })));

    const ok = await state().reserve(offer.id);

    expect(ok).toBe(false);
    expect(state().reservations).toEqual({});
    expect(state().reserveError).toEqual({
      offerId: offer.id,
      message: "Nie udało się zarezerwować lotu. Spróbuj ponownie.",
    });
  });

  it("clears the reservation error on the next attempt", async () => {
    await state().search(criteria);
    const [offer] = state().offers;
    server.use(http.post("*/api/bookings", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));
    await state().reserve(offer.id);

    await state().reserve(offer.id);

    expect(state().reserveError).toBeNull();
  });

  it("does nothing without a search", async () => {
    await expect(state().reserve("cokolwiek")).resolves.toBe(false);
  });
});

describe("flightSearchStore – reset", () => {
  it("clears everything", async () => {
    await state().search(criteria);
    state().setSort("duration");
    state().toggleOffer(state().offers[0].id);

    state().reset();

    expect(state()).toMatchObject({ status: "idle", criteria: null, offers: [], sort: "price", expandedId: null });
  });
});
