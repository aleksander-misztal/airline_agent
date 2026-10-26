import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { criteria, IST_AIRPORT } from "../../test/fixtures";
import { RecentSearches } from "./RecentSearches";
import { useRecentSearchesStore } from "./recentSearchesStore";
import type { SearchCriteria } from "./types";

const roundTrip: SearchCriteria = criteria; // WAW → DOH, 2026-11-10 – 2026-11-20, 2 dorosłych + 1 dziecko, Economy
const oneWay: SearchCriteria = {
  ...criteria,
  tripType: "one_way",
  to: IST_AIRPORT,
  departureDate: "2026-12-05",
  returnDate: null,
  passengers: { adults: 1, children: 0, infants: 0 },
  cabin: "business",
};

beforeEach(() => {
  useRecentSearchesStore.getState().load("u-1");
});

function setup(searches: SearchCriteria[] = [roundTrip, oneWay], today = "2026-11-01") {
  for (const s of searches) useRecentSearchesStore.getState().add(s);
  const onRecall = vi.fn();
  render(<RecentSearches onRecall={onRecall} today={today} />);
  return onRecall;
}

const section = () => within(screen.getByRole("region", { name: "Ostatnie wyszukiwania" }));

describe("RecentSearches", () => {
  it("renders nothing without a history", () => {
    setup([]);

    expect(screen.queryByRole("region", { name: "Ostatnie wyszukiwania" })).not.toBeInTheDocument();
  });

  it("lists the searches, newest first", () => {
    setup();

    const items = section().getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Warszawa (WAW) → Stambuł (IST)");
    expect(items[1]).toHaveTextContent("Warszawa (WAW) → Doha (DOH)");
  });

  it("shows dates, passengers and cabin of a round trip", () => {
    setup([roundTrip]);

    const item = section().getByRole("listitem");
    expect(item).toHaveTextContent("10.11.2026 – 20.11.2026");
    expect(item).toHaveTextContent("2 dorosłych, 1 dziecko");
    expect(item).toHaveTextContent("Economy");
  });

  it("shows a single date and the cabin of a one-way trip", () => {
    setup([oneWay]);

    const item = section().getByRole("listitem");
    expect(item).toHaveTextContent("05.12.2026");
    expect(item).not.toHaveTextContent("–");
    expect(item).toHaveTextContent("Business");
  });

  it("calls back with the saved criteria when a search is picked", async () => {
    const onRecall = setup();

    await userEvent.click(section().getByRole("button", { name: /^Warszawa \(WAW\) → Doha \(DOH\)/ }));

    expect(onRecall).toHaveBeenCalledTimes(1);
    expect(onRecall).toHaveBeenCalledWith(roundTrip);
  });

  it("marks searches whose dates have passed", () => {
    setup([roundTrip, oneWay], "2026-11-15");

    const [istItem, dohItem] = section().getAllByRole("listitem");
    expect(within(dohItem).getByText("Daty minęły")).toBeInTheDocument();
    expect(within(istItem).queryByText("Daty minęły")).not.toBeInTheDocument();
  });

  it("removes one search", async () => {
    setup();

    await userEvent.click(section().getByRole("button", { name: "Usuń z historii: Warszawa (WAW) → Doha (DOH)" }));

    expect(section().getAllByRole("listitem")).toHaveLength(1);
    expect(section().queryByText(/Doha \(DOH\)/)).not.toBeInTheDocument();
    expect(localStorage.getItem("recent-searches:u-1")).not.toContain("DOH");
  });

  it("clears the whole history", async () => {
    setup();

    await userEvent.click(section().getByRole("button", { name: "Wyczyść historię" }));

    expect(screen.queryByRole("region", { name: "Ostatnie wyszukiwania" })).not.toBeInTheDocument();
  });
});
