import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Header } from "./Header";
import { brand } from "../config/brand";
import { plainNumber } from "../test/utils";
import type { User } from "../api";

const user: User = { id: "u-1", username: "admin", displayName: "Administrator" };

const renderHeader = (props: Partial<React.ComponentProps<typeof Header>> = {}, path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header {...props} />
    </MemoryRouter>,
  );

describe("Header", () => {
  it("shows the brand logo as a link to the home page", () => {
    renderHeader();

    const link = screen.getByRole("link", { name: brand.name });
    expect(link).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: brand.name })).toHaveAttribute("src", brand.logo.full);
  });

  it("shows the assistant name", () => {
    renderHeader();

    expect(screen.getByText(brand.assistantName)).toBeInTheDocument();
  });

  it("hides user info and logout when nobody is logged in", () => {
    renderHeader({ user: null });

    expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
  });

  it("shows the user name and logout button when logged in", () => {
    renderHeader({ user, onLogout: () => {} });

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
  });

  it("calls onLogout when the logout button is clicked", async () => {
    const onLogout = vi.fn();
    renderHeader({ user, onLogout });

    await userEvent.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("Header navigation", () => {
  it("shows the Dashboard and Asystent tabs when logged in", () => {
    renderHeader({ user });

    const nav = screen.getByRole("navigation", { name: "Główna nawigacja" });
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(within(nav).getByRole("link", { name: "Wyszukaj loty" })).toHaveAttribute("href", "/flights");
    expect(within(nav).getByRole("link", { name: "Asystent" })).toHaveAttribute("href", "/chat");
  });

  it("keeps the order Dashboard, Wyszukaj loty, Asystent", () => {
    renderHeader({ user });

    const names = within(screen.getByRole("navigation", { name: "Główna nawigacja" }))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(names).toEqual(["Dashboard", "Wyszukaj loty", "Asystent"]);
  });

  it("marks the flight search tab as active on /flights", () => {
    renderHeader({ user }, "/flights");

    expect(screen.getByRole("link", { name: "Wyszukaj loty" })).toHaveAttribute("aria-current", "page");
  });

  it("hides the tabs when nobody is logged in", () => {
    renderHeader({ user: null });

    expect(screen.queryByRole("navigation", { name: "Główna nawigacja" })).not.toBeInTheDocument();
  });

  it("marks the active tab", () => {
    renderHeader({ user }, "/chat");

    expect(screen.getByRole("link", { name: "Asystent" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});

describe("Header Avios balance", () => {
  it("shows the balance next to the user", () => {
    renderHeader({ user, avios: 48250 });

    expect(screen.getByText(`${plainNumber(48250)} Avios`)).toBeInTheDocument();
  });

  it("is hidden when nobody is logged in", () => {
    renderHeader({ user: null, avios: 48250 });

    expect(screen.queryByText(/Avios/)).not.toBeInTheDocument();
  });

  it("is hidden until the balance is loaded", () => {
    renderHeader({ user, avios: null });

    expect(screen.queryByText(/Avios/)).not.toBeInTheDocument();
  });

  it("shows a zero balance", () => {
    renderHeader({ user, avios: 0 });

    expect(screen.getByText("0 Avios")).toBeInTheDocument();
  });
});
