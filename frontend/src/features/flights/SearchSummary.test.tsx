import { render, screen, within } from "@testing-library/react";
import { SearchSummary } from "./SearchSummary";
import type { SearchCriteria } from "./types";

const criteria: SearchCriteria = {
  tripType: "round_trip",
  from: { code: "WAW", city: "Warszawa", country: "Polska", name: "Warsaw Chopin Airport" },
  to: { code: "DOH", city: "Doha", country: "Katar", name: "Hamad International Airport" },
  departureDate: "2026-11-10",
  returnDate: "2026-11-20",
  passengers: { adults: 2, children: 1, infants: 0 },
  cabin: "business",
};

const region = () => within(screen.getByRole("region", { name: "Kryteria wyszukiwania" }));

describe("SearchSummary", () => {
  it("shows the route, dates, passengers and cabin of a round trip", () => {
    render(<SearchSummary criteria={criteria} />);

    expect(region().getByText("Warszawa (WAW) → Doha (DOH)")).toBeInTheDocument();
    expect(region().getByText("10.11.2026 – 20.11.2026")).toBeInTheDocument();
    expect(region().getByText("2 dorosłych, 1 dziecko")).toBeInTheDocument();
    expect(region().getByText("Business")).toBeInTheDocument();
  });

  it("shows only the departure date for a one-way trip", () => {
    render(<SearchSummary criteria={{ ...criteria, tripType: "one_way", returnDate: null }} />);

    expect(region().getByText("10.11.2026")).toBeInTheDocument();
    expect(region().getByText("W jedną stronę")).toBeInTheDocument();
  });
});
