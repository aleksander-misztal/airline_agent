import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationList } from "./ConversationList";
import type { Conversation } from "../../api";

const conv = (id: string, title: string): Conversation => ({ id, title, createdAt: "2026-11-01T10:00:00Z" });
const conversations = [conv("c-2", "Bagaż podręczny"), conv("c-1", "Status lotu QR123")];

const setup = (props: Partial<React.ComponentProps<typeof ConversationList>> = {}) => {
  const handlers = { onSelect: vi.fn(), onNew: vi.fn(), onDelete: vi.fn() };
  render(<ConversationList conversations={conversations} activeId={null} {...handlers} {...props} />);
  return handlers;
};

describe("ConversationList", () => {
  it("is exposed as the conversations navigation", () => {
    setup();

    expect(screen.getByRole("navigation", { name: "Rozmowy" })).toBeInTheDocument();
  });

  it("starts a new conversation", async () => {
    const { onNew } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Nowa rozmowa" }));

    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("lists conversations in the given order", () => {
    setup();

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Bagaż podręczny");
    expect(items[1]).toHaveTextContent("Status lotu QR123");
  });

  it("shows an empty state without conversations", () => {
    setup({ conversations: [] });

    expect(screen.getByText("Brak zapisanych rozmów")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("marks the active conversation", () => {
    setup({ activeId: "c-1" });

    expect(screen.getByRole("button", { name: "Status lotu QR123" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Bagaż podręczny" })).not.toHaveAttribute("aria-current");
  });

  it("selects a conversation on click", async () => {
    const { onSelect } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Status lotu QR123" }));

    expect(onSelect).toHaveBeenCalledWith("c-1");
  });

  it("deletes a conversation with its own button", async () => {
    const { onDelete, onSelect } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Usuń rozmowę: Bagaż podręczny" }));

    expect(onDelete).toHaveBeenCalledWith("c-2");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disables every action while disabled", () => {
    setup({ disabled: true });

    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
});
