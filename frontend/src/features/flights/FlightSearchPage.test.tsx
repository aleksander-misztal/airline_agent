import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authApi } from "../../api";
import { FlightSearchPage } from "./FlightSearchPage";

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

describe("FlightSearchPage", () => {
  it("shows the page heading and the search form", () => {
    render(<FlightSearchPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Wyszukaj loty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Szukaj lotów" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Kryteria wyszukiwania" })).not.toBeInTheDocument();
  });

  it("shows the chosen criteria after a valid search", async () => {
    render(<FlightSearchPage />);
    await userEvent.click(screen.getByRole("combobox", { name: "Skąd" }));
    await userEvent.type(screen.getByRole("combobox", { name: "Skąd" }), "war");
    await userEvent.click(await screen.findByRole("option", { name: /Warszawa/ }));
    await userEvent.click(screen.getByRole("combobox", { name: "Dokąd" }));
    await userEvent.type(screen.getByRole("combobox", { name: "Dokąd" }), "doh");
    await userEvent.click(await screen.findByRole("option", { name: /Doha/ }));
    fireEvent.change(screen.getByLabelText("Data wylotu"), { target: { value: inDays(30) } });
    fireEvent.change(screen.getByLabelText("Data powrotu"), { target: { value: inDays(37) } });

    await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

    const summary = await screen.findByRole("region", { name: "Kryteria wyszukiwania" });
    expect(summary).toHaveTextContent("Warszawa (WAW) → Doha (DOH)");
  });
});
