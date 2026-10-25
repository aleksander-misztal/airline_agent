import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { brand } from "../config/brand";

describe("Footer", () => {
  it("shows the brand name with the current year", () => {
    render(<Footer />);

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`©\\s*${year}\\s*${brand.name}`))).toBeInTheDocument();
  });

  it("states that this is a training project", () => {
    render(<Footer />);

    expect(screen.getByText(/projekt treningowy/i)).toBeInTheDocument();
  });

  it("is exposed as the page footer landmark", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
