import { render, screen } from "@testing-library/react";
import App from "./App";
import { brand } from "./config/brand";

describe("App (smoke)", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("shows the brand logo", () => {
    render(<App />);
    const logo = screen.getByRole("img", { name: brand.name });
    expect(logo).toHaveAttribute("src", brand.logo.full);
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
