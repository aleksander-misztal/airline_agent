import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { authApi } from "../../api";
import { summary } from "../../api/mocks/dashboard";
import { server } from "../../api/mocks/server";
import { brand } from "../../config/brand";
import { plainNumber } from "../../test/utils";
import { useAuthStore } from "../auth/authStore";
import { DashboardPage } from "./DashboardPage";

beforeEach(async () => {
  const user = await authApi.login("admin", "admin");
  useAuthStore.setState({ user, status: "authenticated" });
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

const tile = async (name: string) => within(await screen.findByRole("region", { name }));

describe("DashboardPage", () => {
  it("greets the user by name", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Dzień dobry, Administrator" })).toBeInTheDocument();
  });

  it("shows the Avios tile", async () => {
    renderPage();

    expect((await tile("Avios")).getByText(plainNumber(summary.avios))).toBeInTheDocument();
  });

  it("shows the miles flown tile", async () => {
    renderPage();

    expect((await tile("Przebyte mile")).getByText(plainNumber(summary.milesFlown))).toBeInTheDocument();
  });

  it("shows the flights taken tile", async () => {
    renderPage();

    expect((await tile("Odbyte loty")).getByText(plainNumber(summary.flightsTaken))).toBeInTheDocument();
  });

  it("lists upcoming bookings", async () => {
    renderPage();

    const bookings = await tile("Nadchodzące rezerwacje");
    expect(bookings.getAllByRole("listitem")).toHaveLength(summary.upcomingBookings.length);
    for (const b of summary.upcomingBookings) {
      expect(bookings.getByText(b.reference)).toBeInTheDocument();
      expect(bookings.getByText(`${b.from} → ${b.to}`)).toBeInTheDocument();
      expect(bookings.getByText(b.flightNumber)).toBeInTheDocument();
    }
  });

  it("shows an empty state without upcoming bookings", async () => {
    server.use(http.get("*/api/dashboard", () => HttpResponse.json({ ...summary, upcomingBookings: [] })));

    renderPage();

    const bookings = await tile("Nadchodzące rezerwacje");
    expect(bookings.getByText("Brak nadchodzących rezerwacji")).toBeInTheDocument();
    expect(bookings.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("links to the flight search in a new tab", async () => {
    renderPage();

    const link = (await tile("Wyszukiwarka lotów")).getByRole("link", { name: "Wyszukaj loty" });
    expect(link).toHaveAttribute("href", brand.flightSearchUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows a loading state while the data is fetched", async () => {
    server.use(
      http.get("*/api/dashboard", async () => {
        await delay(150);
        return HttpResponse.json(summary);
      }),
    );

    renderPage();

    expect(await screen.findByRole("status")).toBeInTheDocument();
    await tile("Avios");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an error with a retry button", async () => {
    server.use(http.get("*/api/dashboard", () => HttpResponse.json({ error: "x" }, { status: 500 }), { once: true }));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wczytać danych");

    await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect((await tile("Avios")).getByText(plainNumber(summary.avios))).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
