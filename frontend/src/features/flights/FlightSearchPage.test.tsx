import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { authApi } from "../../api";
import { server } from "../../api/mocks/server";
import { connectingOffer, directOffer } from "../../test/fixtures";
import { searchFlights } from "../../test/utils";
import { useDashboardStore } from "../dashboard/dashboardStore";
import { FlightSearchPage } from "./FlightSearchPage";
import { useFlightSearchStore } from "./flightSearchStore";

beforeEach(async () => {
  await authApi.login("admin", "admin");
  render(<FlightSearchPage />);
});

const resultsList = () => screen.findByRole("list", { name: "Wyniki wyszukiwania" });
const offerItems = async () => Array.from((await resultsList()).children) as HTMLElement[];
const offerIds = async () => (await offerItems()).map((item) => item.dataset.offerId);
const header = (item: HTMLElement) => within(item).getByRole("button", { expanded: item.querySelector("[role=region]") !== null });

describe("FlightSearchPage – before a search", () => {
  it("shows the page heading and only the search form", () => {
    expect(screen.getByRole("heading", { level: 1, name: "Wyszukaj loty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Szukaj lotów" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Kryteria wyszukiwania" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Wyniki wyszukiwania" })).not.toBeInTheDocument();
  });
});

describe("FlightSearchPage – results", () => {
  it("lists the offers next to the form, with the chosen criteria", async () => {
    await searchFlights();

    const summary = await screen.findByRole("region", { name: "Kryteria wyszukiwania" });
    expect(summary).toHaveTextContent("Warszawa (WAW) → Doha (DOH)");
    expect((await offerItems()).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/^Znaleziono \d+ of/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Szukaj lotów" })).toBeInTheDocument();
  });

  it("shows a loading state while searching", async () => {
    server.use(
      http.get("*/api/flights/search", async () => {
        await delay(150);
        return HttpResponse.json({ offers: [directOffer, connectingOffer] });
      }),
    );

    await searchFlights();

    expect(await screen.findByRole("status")).toHaveTextContent("Szukam lotów…");
    expect(await offerItems()).toHaveLength(2);
    expect(screen.getByText("Znaleziono 2 oferty")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an error and searches again on request", async () => {
    server.use(http.get("*/api/flights/search", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));
    await searchFlights();

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wyszukać lotów");
    await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect((await offerItems()).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tells when there are no flights", async () => {
    server.use(http.get("*/api/flights/search", () => HttpResponse.json({ offers: [] })));

    await searchFlights();

    expect(await screen.findByText("Brak lotów spełniających kryteria")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Wyniki wyszukiwania" })).not.toBeInTheDocument();
  });

  it("sorts the offers", async () => {
    await searchFlights();
    await resultsList();
    const byPrice = await offerIds();
    const { offers } = useFlightSearchStore.getState();
    const duration = (id: string) => offers.find((o) => o.id === id)!.legs.reduce((s, l) => s + l.durationMinutes, 0);

    await userEvent.selectOptions(screen.getByLabelText("Sortuj"), "duration");

    const byDuration = await offerIds();
    expect(byDuration).not.toEqual(byPrice);
    const durations = byDuration.map((id) => duration(id!));
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
  });

  it("filters direct flights only", async () => {
    await searchFlights();
    const all = (await offerItems()).length;

    await userEvent.click(screen.getByRole("checkbox", { name: "Tylko bezpośrednie" }));

    const direct = await offerItems();
    expect(direct.length).toBeGreaterThan(0);
    expect(direct.length).toBeLessThan(all);
    for (const item of direct) expect(within(item).getAllByText("Bezpośredni").length).toBeGreaterThan(0);
  });

  it("explains when the filter leaves nothing", async () => {
    await searchFlights({ to: ["syd", /Sydney/] });
    await resultsList();

    await userEvent.click(screen.getByRole("checkbox", { name: "Tylko bezpośrednie" }));

    expect(await screen.findByText("Brak lotów spełniających kryteria")).toBeInTheDocument();
  });
});

describe("FlightSearchPage – expanding an offer", () => {
  it("opens the details in place, one offer at a time", async () => {
    await searchFlights();
    const [first, second] = await offerItems();

    await userEvent.click(header(first));
    expect(within(first).getByRole("region", { name: "Szczegóły lotu" })).toBeInTheDocument();
    expect(within(first).getAllByRole("list", { name: "Przebieg lotu" })).toHaveLength(2);

    await userEvent.click(header(second));
    expect(within(second).getByRole("region", { name: "Szczegóły lotu" })).toBeInTheDocument();
    expect(within(first).queryByRole("region", { name: "Szczegóły lotu" })).not.toBeInTheDocument();
  });

  it("keeps the search form on screen while an offer is open", async () => {
    await searchFlights();
    const [first] = await offerItems();

    await userEvent.click(header(first));

    expect(screen.getByLabelText("Klasa podróży")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Skąd" })).toHaveValue("Warszawa (WAW)");
  });
});

describe("FlightSearchPage – reserving", () => {
  it("reserves the offer, confirms it and puts it on the dashboard", async () => {
    await searchFlights();
    const [first] = await offerItems();
    await userEvent.click(header(first));

    await userEvent.click(within(first).getByRole("button", { name: "Rezerwuj" }));

    const status = await within(first).findByRole("status");
    const reference = status.textContent!.match(/Kod rezerwacji: ([A-Z0-9]{6})/)![1];
    expect(within(first).queryByRole("button", { name: "Rezerwuj" })).not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(useDashboardStore.getState().summary?.upcomingBookings.map((b) => b.reference)).toContain(reference),
    );
  });

  it("shows an error and lets the user try again", async () => {
    server.use(http.post("*/api/bookings", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));
    await searchFlights();
    const [first] = await offerItems();
    await userEvent.click(header(first));

    await userEvent.click(within(first).getByRole("button", { name: "Rezerwuj" }));

    expect(await within(first).findByRole("alert")).toHaveTextContent("Nie udało się zarezerwować lotu");
    await userEvent.click(within(first).getByRole("button", { name: "Rezerwuj" }));
    expect(await within(first).findByRole("status")).toHaveTextContent("Rezerwacja potwierdzona");
  });
});

describe("FlightSearchPage – searching again", () => {
  it("replaces the results when the criteria change", async () => {
    await searchFlights();
    const before = await offerIds();

    await userEvent.selectOptions(screen.getByLabelText("Klasa podróży"), "business");
    await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

    await vi.waitFor(async () => expect(await offerIds()).not.toEqual(before));
    expect(screen.getByRole("region", { name: "Kryteria wyszukiwania" })).toHaveTextContent("Business");
    expect((await offerIds()).every((id) => id!.includes("business"))).toBe(true);
  });
});
