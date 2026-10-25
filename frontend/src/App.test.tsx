import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App";
import { authApi } from "./api";
import { brand } from "./config/brand";

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const loginHeading = () => screen.findByRole("heading", { name: "Logowanie" });
const chatHeading = () => screen.findByRole("heading", { name: "Czat" });

async function logInThroughForm() {
  await userEvent.type(screen.getByLabelText("Login"), "admin");
  await userEvent.type(screen.getByLabelText("Hasło"), "admin");
  await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
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

  it("redirects / to /chat when a session exists", async () => {
    await authApi.login("admin", "admin");

    renderApp("/");

    expect(await chatHeading()).toBeInTheDocument();
  });

  it("redirects / to /login when there is no session", async () => {
    renderApp("/");

    expect(await loginHeading()).toBeInTheDocument();
  });

  it("redirects a logged-in user from /login to /chat", async () => {
    await authApi.login("admin", "admin");

    renderApp("/login");

    expect(await chatHeading()).toBeInTheDocument();
  });

  it("hides user info and logout while anonymous", async () => {
    renderApp("/login");

    await loginHeading();
    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
  });

  it("logs in through the form and shows the user in the header", async () => {
    renderApp("/login");
    await loginHeading();

    await logInThroughForm();

    expect(await chatHeading()).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
  });

  it("logs out and returns to /login", async () => {
    renderApp("/login");
    await loginHeading();
    await logInThroughForm();
    await chatHeading();

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(await loginHeading()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
    await expect(authApi.me()).resolves.toBeNull();
  });
});

describe("App chat session", () => {
  it("clears the open chat on logout, while history stays available after logging in again", async () => {
    renderApp("/login");
    await loginHeading();
    await logInThroughForm();
    await chatHeading();
    await userEvent.type(screen.getByRole("textbox", { name: "Wiadomość" }), "Cześć{Enter}");
    await within(await screen.findByRole("list", { name: "Wiadomości" })).findByText("Cześć");

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));
    await loginHeading();
    await logInThroughForm();
    await chatHeading();

    expect(screen.queryByRole("list", { name: "Wiadomości" })).not.toBeInTheDocument();
    expect(screen.getByText("W czym mogę pomóc?")).toBeInTheDocument();
    const history = within(screen.getByRole("navigation", { name: "Rozmowy" }));
    expect(await history.findByRole("button", { name: "Cześć" })).toBeInTheDocument();
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
