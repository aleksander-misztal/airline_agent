import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authApi } from "../../api";
import { criteria } from "../../test/fixtures";
import { inDays, searchFlights } from "../../test/utils";
import { FlightSearchPage } from "./FlightSearchPage";
import { useFlightSearchStore } from "./flightSearchStore";
import { useRecentSearchesStore } from "./recentSearchesStore";
import type { SearchCriteria } from "./types";

// Strona bez zalogowanego użytkownika w store używa listy "guest".
const USER = "guest";

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

const renderPage = () => render(<FlightSearchPage />);
const history = () => within(screen.getByRole("region", { name: "Ostatnie wyszukiwania" }));
const box = (name: string) => screen.getByRole("combobox", { name });

function seed(search: SearchCriteria) {
  useRecentSearchesStore.getState().load(USER);
  useRecentSearchesStore.getState().add(search);
}

/** Odświeżenie strony: pamięć aplikacji znika, localStorage zostaje. */
function resetMemory() {
  useRecentSearchesStore.setState(useRecentSearchesStore.getInitialState(), true);
  useFlightSearchStore.setState(useFlightSearchStore.getInitialState(), true);
}

describe("FlightSearchPage – recent searches", () => {
  it("has no history before the first search", () => {
    renderPage();

    expect(screen.queryByRole("region", { name: "Ostatnie wyszukiwania" })).not.toBeInTheDocument();
  });

  it("remembers a search and shows it under the form", async () => {
    renderPage();

    await searchFlights();

    expect(await screen.findByRole("region", { name: "Ostatnie wyszukiwania" })).toBeInTheDocument();
    expect(history().getAllByRole("listitem")).toHaveLength(1);
    expect(history().getByRole("listitem")).toHaveTextContent("Warszawa (WAW) → Doha (DOH)");
  });

  it("keeps a repeated search as a single entry", async () => {
    renderPage();
    await searchFlights();
    await screen.findByRole("list", { name: "Wyniki wyszukiwania" });

    await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

    expect(history().getAllByRole("listitem")).toHaveLength(1);
  });

  it("does not remember a search that failed validation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

    expect(screen.queryByRole("region", { name: "Ostatnie wyszukiwania" })).not.toBeInTheDocument();
  });

  it("keeps the history after the page is reloaded", async () => {
    const view = renderPage();
    await searchFlights();
    await screen.findByRole("region", { name: "Ostatnie wyszukiwania" });
    view.unmount();
    resetMemory();

    renderPage();

    expect(await screen.findByRole("region", { name: "Ostatnie wyszukiwania" })).toBeInTheDocument();
    expect(history().getByRole("listitem")).toHaveTextContent("Warszawa (WAW) → Doha (DOH)");
  });

  it("runs a saved search with one click and fills in the form", async () => {
    seed({ ...criteria, departureDate: inDays(30), returnDate: inDays(37) });
    renderPage();

    await userEvent.click(await history().findByRole("button", { name: /^Warszawa \(WAW\) → Doha \(DOH\)/ }));

    expect(await screen.findByRole("list", { name: "Wyniki wyszukiwania" })).toBeInTheDocument();
    expect(box("Skąd")).toHaveValue("Warszawa (WAW)");
    expect(box("Dokąd")).toHaveValue("Doha (DOH)");
    expect(screen.getByLabelText("Data wylotu")).toHaveValue(inDays(30));
    expect(screen.getByRole("region", { name: "Kryteria wyszukiwania" })).toHaveTextContent("2 dorosłych, 1 dziecko");
  });

  it("fills in the form but does not search when the saved dates have passed", async () => {
    seed({ ...criteria, departureDate: "2020-01-10", returnDate: "2020-01-20" });
    renderPage();
    await history().findByText("Daty minęły");

    await userEvent.click(history().getByRole("button", { name: /^Warszawa \(WAW\) → Doha \(DOH\)/ }));

    expect(await screen.findByText("Daty z zapisanego wyszukiwania już minęły – wybierz nowe")).toBeInTheDocument();
    expect(box("Skąd")).toHaveValue("Warszawa (WAW)");
    expect(box("Dokąd")).toHaveValue("Doha (DOH)");
    expect(screen.getByLabelText("Data wylotu")).toHaveValue("");
    expect(screen.getByLabelText("Data powrotu")).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Wyniki wyszukiwania" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Kryteria wyszukiwania" })).not.toBeInTheDocument();
  });

  it("lets the user pick new dates for an expired search and run it", async () => {
    seed({ ...criteria, departureDate: "2020-01-10", returnDate: "2020-01-20" });
    renderPage();
    await userEvent.click(await history().findByRole("button", { name: /^Warszawa \(WAW\) → Doha \(DOH\)/ }));
    await screen.findByText(/już minęły/);

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(screen.getByLabelText("Data wylotu"), { target: { value: inDays(30) } });
    fireEvent.change(screen.getByLabelText("Data powrotu"), { target: { value: inDays(37) } });
    await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

    expect(await screen.findByRole("list", { name: "Wyniki wyszukiwania" })).toBeInTheDocument();
    expect(history().getAllByRole("listitem")).toHaveLength(2);
  });
});
