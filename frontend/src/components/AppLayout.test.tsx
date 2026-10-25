import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppLayout } from "./AppLayout";
import type { User } from "../api";

const user: User = { id: "u-1", username: "admin", displayName: "Administrator" };

const renderLayout = (props: Partial<React.ComponentProps<typeof AppLayout>> = {}) =>
  render(
    <MemoryRouter>
      <AppLayout {...props}>
        <p>Treść strony</p>
      </AppLayout>
    </MemoryRouter>,
  );

describe("AppLayout", () => {
  it("renders header, main content and footer", () => {
    renderLayout();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Treść strony");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("keeps the order header → main → footer", () => {
    renderLayout();

    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("passes the user and logout handler to the header", () => {
    renderLayout({ user, onLogout: () => {} });

    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeInTheDocument();
  });
});
