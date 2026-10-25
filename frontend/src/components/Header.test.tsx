import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Header } from "./Header";
import { brand } from "../config/brand";
import type { User } from "../api";

const user: User = { id: "u-1", username: "admin", displayName: "Administrator" };

const renderHeader = (props: Partial<React.ComponentProps<typeof Header>> = {}) =>
  render(
    <MemoryRouter>
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
