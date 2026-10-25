import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionChips } from "./SuggestionChips";
import { suggestions } from "./suggestions";

describe("SuggestionChips", () => {
  it("offers the four quick suggestions", () => {
    render(<SuggestionChips onSelect={() => {}} />);

    expect(suggestions.map((s) => s.label)).toEqual(["Status lotu", "Moja rezerwacja", "Bagaż", "Odprawa online"]);
    for (const { label } of suggestions) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it.each(suggestions)("clicking “$label” selects its prompt", async ({ label, prompt }) => {
    const onSelect = vi.fn();
    render(<SuggestionChips onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(onSelect).toHaveBeenCalledWith(prompt);
  });

  it("disables all chips when disabled", () => {
    render(<SuggestionChips onSelect={() => {}} disabled />);

    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
});
