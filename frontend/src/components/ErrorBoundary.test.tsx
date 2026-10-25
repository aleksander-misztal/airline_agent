import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when nothing fails", () => {
    render(
      <ErrorBoundary>
        <p>Wszystko działa</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Wszystko działa")).toBeInTheDocument();
  });

  it("shows a fallback instead of a blank page when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Coś poszło nie tak");
    expect(screen.getByRole("button", { name: "Odśwież stronę" })).toBeInTheDocument();
  });

  it("reloads the page from the fallback", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Odśwież stronę" }));

    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
