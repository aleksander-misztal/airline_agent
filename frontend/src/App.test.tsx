import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import App from "./App";
import { authApi } from "./api";
import { summary } from "./api/mocks/dashboard";
import { server } from "./api/mocks/server";
import { brand } from "./config/brand";
import { plainNumber } from "./test/utils";

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const loginHeading = () => screen.findByRole("heading", { name: "Logowanie" });
const dashboardHeading = () => screen.findByRole("heading", { level: 1, name: /Dzień dobry/ });
const chatHeading = () => screen.findByRole("heading", { name: "Czat" });
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

  it("points the flight search to an external https page", () => {
    expect(brand.flightSearchUrl).toMatch(/^https:\/\//);
  });
});
