import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import App from "./App";
import { authApi } from "./api";
import { summary } from "./api/mocks/dashboard";
import { server } from "./api/mocks/server";
import { brand } from "./config/brand";
import { plainNumber, searchFlights } from "./test/utils";

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const loginHeading = () => screen.findByRole("heading", { name: "Logowanie" });
const dashboardHeading = () => screen.findByRole("heading", { level: 1, name: /Dzień dobry/ });
const chatHeading = () => screen.findByRole("heading", { name: "Czat" });
const flightsHeading = () => screen.findByRole("heading", { level: 1, name: "Wyszukaj loty" });
const mainNav = () => within(screen.getByRole("navigation", { name: "Główna nawigacja" }));
const aviosInHeader = () => screen.findByText(`${plainNumber(summary.avios)} Avios`);

async function logInThroughForm() {
  await userEvent.type(screen.getByLabelText("Login"), "admin");
  await userEvent.type(screen.getByLabelText("Hasło"), "admin");
  await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
}

async function openAssistantTab() {
  await userEvent.click(screen.getByRole("link", { name: "Asystent" }));
  await chatHeading();
}

describe("App (smoke)", () => {
  it("renders the layout with the brand logo", async () => {
    renderApp("/login");

    await loginHeading();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: brand.name })).toHaveAttribute("src", brand.logo.full);
  });
});

describe("App routing and session", () => {
  it("redirects an anonymous user from /chat to /login", async () => {
    renderApp("/chat");

    expect(await loginHeading()).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Czat" })).not.toBeInTheDocument();
  });

  it("redirects an anonymous user from /dashboard to /login", async () => {
    renderApp("/dashboard");

    expect(await loginHeading()).toBeInTheDocument();
  });

  it("redirects an anonymous user from /flights to /login", async () => {
    renderApp("/flights");

    expect(await loginHeading()).toBeInTheDocument();
  });

  it("opens the flight search from the tab", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();

    await userEvent.click(mainNav().getByRole("link", { name: "Wyszukaj loty" }));

    expect(await flightsHeading()).toBeInTheDocument();
    expect(mainNav().getByRole("link", { name: "Wyszukaj loty" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the flight search from the dashboard tile", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    const tile = within(await screen.findByRole("region", { name: "Wyszukiwarka lotów" }));

    await userEvent.click(tile.getByRole("link", { name: "Wyszukaj loty" }));

    expect(await flightsHeading()).toBeInTheDocument();
  });

  it("redirects / to the dashboard when a session exists", async () => {
    await authApi.login("admin", "admin");

    renderApp("/");

    expect(await dashboardHeading()).toBeInTheDocument();
  });

  it("redirects / to /login when there is no session", async () => {
    renderApp("/");

    expect(await loginHeading()).toBeInTheDocument();
  });

  it("redirects an unknown address to the dashboard", async () => {
    await authApi.login("admin", "admin");

    renderApp("/nie-ma-takiej-strony");

    expect(await dashboardHeading()).toBeInTheDocument();
  });

  it("redirects a logged-in user from /login to the dashboard", async () => {
    await authApi.login("admin", "admin");

    renderApp("/login");

    expect(await dashboardHeading()).toBeInTheDocument();
  });

  it("hides user info, tabs and Avios while anonymous", async () => {
    renderApp("/login");

    await loginHeading();
    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Główna nawigacja" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Avios/)).not.toBeInTheDocument();
  });

  it("logs in through the form and lands on the dashboard with the user in the header", async () => {
    renderApp("/login");
    await loginHeading();

    await logInThroughForm();

    expect(await dashboardHeading()).toBeInTheDocument();
    expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  it("shows the Avios balance in the header", async () => {
    await authApi.login("admin", "admin");

    renderApp("/dashboard");

    expect(await aviosInHeader()).toBeInTheDocument();
  });

  it("switches between the Dashboard and Asystent tabs and keeps Avios in the header", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await aviosInHeader();

    await openAssistantTab();
    expect(screen.getByRole("link", { name: "Asystent" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(`${plainNumber(summary.avios)} Avios`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Dashboard" }));
    expect(await dashboardHeading()).toBeInTheDocument();
  });

  it("logs out and returns to /login", async () => {
    renderApp("/login");
    await loginHeading();
    await logInThroughForm();
    await dashboardHeading();

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(await loginHeading()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Avios/)).not.toBeInTheDocument();
    await expect(authApi.me()).resolves.toBeNull();
  });
});

describe("App flight search", () => {
  it("lets the user find a flight, reserve it and see the reservation on the dashboard", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();
    const tile = within(await screen.findByRole("region", { name: "Wyszukiwarka lotów" }));
    await userEvent.click(tile.getByRole("link", { name: "Wyszukaj loty" }));
    await flightsHeading();

    await searchFlights();
    const list = await screen.findByRole("list", { name: "Wyniki wyszukiwania" });
    const [first] = Array.from(list.children) as HTMLElement[];
    await userEvent.click(within(first).getByRole("button", { expanded: false }));
    await userEvent.click(within(first).getByRole("button", { name: "Rezerwuj" }));
    const confirmation = await within(first).findByRole("status");
    const reference = confirmation.textContent!.match(/Kod rezerwacji: ([A-Z0-9]{6})/)![1];

    await userEvent.click(mainNav().getByRole("link", { name: "Dashboard" }));

    const bookings = within(await screen.findByRole("region", { name: "Nadchodzące rezerwacje" }));
    expect((await bookings.findAllByText(reference)).length).toBeGreaterThan(0);
  });

  it("forgets the search results after logging out", async () => {
    await authApi.login("admin", "admin");
    renderApp("/flights");
    await flightsHeading();
    await searchFlights();
    await screen.findByRole("list", { name: "Wyniki wyszukiwania" });

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));
    await loginHeading();
    await logInThroughForm();
    await dashboardHeading();
    await userEvent.click(mainNav().getByRole("link", { name: "Wyszukaj loty" }));
    await flightsHeading();

    expect(screen.queryByRole("list", { name: "Wyniki wyszukiwania" })).not.toBeInTheDocument();
  });
});

describe("App assistant popup", () => {
  const popupIcon = () => screen.queryByRole("button", { name: "Otwórz asystenta" });

  it("is not offered before logging in", async () => {
    renderApp("/login");

    await loginHeading();
    expect(popupIcon()).not.toBeInTheDocument();
  });

  it("is offered on every page except the Asystent tab", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();
    expect(popupIcon()).toBeInTheDocument();

    await userEvent.click(mainNav().getByRole("link", { name: "Wyszukaj loty" }));
    await flightsHeading();
    expect(popupIcon()).toBeInTheDocument();

    await openAssistantTab();
    expect(popupIcon()).not.toBeInTheDocument();
  });

  it("keeps the popup conversation when moving between pages", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();
    await userEvent.click(screen.getByRole("button", { name: "Otwórz asystenta" }));
    const dialog = within(screen.getByRole("dialog", { name: "Asystent" }));
    await userEvent.type(dialog.getByRole("textbox", { name: "Wiadomość" }), "Cześć{Enter}");
    await within(dialog.getByRole("list", { name: "Wiadomości" })).findByText("Cześć");
    await userEvent.click(dialog.getByRole("button", { name: "Zamknij asystenta" }));

    await userEvent.click(mainNav().getByRole("link", { name: "Wyszukaj loty" }));
    await flightsHeading();
    await userEvent.click(screen.getByRole("button", { name: "Otwórz asystenta" }));

    const reopened = within(screen.getByRole("dialog", { name: "Asystent" }));
    expect(reopened.getByRole("list", { name: "Wiadomości" })).toHaveTextContent("Cześć");
  });

  it("shows the popup conversation in the Asystent tab, on the list and opened", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();
    await userEvent.click(screen.getByRole("button", { name: "Otwórz asystenta" }));
    const dialog = within(screen.getByRole("dialog", { name: "Asystent" }));
    await userEvent.click(dialog.getByRole("button", { name: "Status lotu" }));
    await dialog.findByText("Planowy");

    await userEvent.click(mainNav().getByRole("link", { name: "Asystent" }));
    await chatHeading();

    const history = within(screen.getByRole("navigation", { name: "Rozmowy" }));
    const item = await history.findByRole("button", { name: "Jaki jest status mojego lotu QR123?" });
    expect(item).toHaveAttribute("aria-current", "true");
    const thread = within(screen.getByRole("list", { name: "Wiadomości" }));
    expect(thread.getByText("Planowy")).toBeInTheDocument();
  });

  it("starts a fresh popup conversation after a visit to the Asystent tab", async () => {
    await authApi.login("admin", "admin");
    renderApp("/dashboard");
    await dashboardHeading();
    await userEvent.click(screen.getByRole("button", { name: "Otwórz asystenta" }));
    const first = within(screen.getByRole("dialog", { name: "Asystent" }));
    await userEvent.type(first.getByRole("textbox", { name: "Wiadomość" }), "Cześć{Enter}");
    await within(first.getByRole("list", { name: "Wiadomości" })).findByText("Cześć");
    await userEvent.click(first.getByRole("button", { name: "Zamknij asystenta" }));

    await openAssistantTab();
    await userEvent.click(mainNav().getByRole("link", { name: "Dashboard" }));
    await dashboardHeading();
    await userEvent.click(screen.getByRole("button", { name: "Otwórz asystenta" }));

    const second = within(screen.getByRole("dialog", { name: "Asystent" }));
    expect(second.queryByRole("list", { name: "Wiadomości" })).not.toBeInTheDocument();
    expect(second.getByText("W czym mogę pomóc?")).toBeInTheDocument();
  });
});

describe("App chat session", () => {
  it("clears the open chat on logout, while history stays available after logging in again", async () => {
    renderApp("/login");
    await loginHeading();
    await logInThroughForm();
    await dashboardHeading();
    await openAssistantTab();
    await userEvent.type(screen.getByRole("textbox", { name: "Wiadomość" }), "Cześć{Enter}");
    await within(await screen.findByRole("list", { name: "Wiadomości" })).findByText("Cześć");

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));
    await loginHeading();
    await logInThroughForm();
    await dashboardHeading();
    await openAssistantTab();

    expect(screen.queryByRole("list", { name: "Wiadomości" })).not.toBeInTheDocument();
    expect(screen.getByText("W czym mogę pomóc?")).toBeInTheDocument();
    const history = within(screen.getByRole("navigation", { name: "Rozmowy" }));
    expect(await history.findByRole("button", { name: "Cześć" })).toBeInTheDocument();
  });
});

describe("App session expiry", () => {
  it("returns to the login page with a message when the session expires mid-chat", async () => {
    await authApi.login("admin", "admin");
    renderApp("/chat");
    await chatHeading();
    server.use(http.post("*/api/conversations", () => HttpResponse.json({ error: "x" }, { status: 401 })));

    await userEvent.type(screen.getByRole("textbox", { name: "Wiadomość" }), "Cześć{Enter}");

    expect(await loginHeading()).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Sesja wygasła. Zaloguj się ponownie.");
    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
  });

  it("returns to the login page when the dashboard data is rejected with 401", async () => {
    await authApi.login("admin", "admin");
    server.use(http.get("*/api/dashboard", () => HttpResponse.json({ error: "x" }, { status: 401 })));

    renderApp("/dashboard");

    expect(await loginHeading()).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Sesja wygasła. Zaloguj się ponownie.");
  });
});

describe("brand config", () => {
  it("defines Qatar Airways identity", () => {
    expect(brand.name).toBe("Qatar Airways");
    expect(brand.colors.primary).toBe("#5C0632");
    expect(brand.logo.full).toBe("/brand/logo-full.png");
    expect(brand.logo.oryx).toBe("/brand/logo-oryx.png");
  });

});
