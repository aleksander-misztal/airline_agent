import { render, screen } from "@testing-library/react";
import { MessageList } from "./MessageList";
import type { Message } from "../../api";

const msg = (id: string, role: "user" | "assistant", text: string): Message => ({
  id,
  conversationId: "c-1",
  role,
  type: "text",
  payload: { text },
  createdAt: "2026-11-01T10:00:00Z",
});

describe("MessageList", () => {
  it("renders messages in order", () => {
    render(<MessageList messages={[msg("1", "user", "Pierwsza"), msg("2", "assistant", "Druga")]} sending={false} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Pierwsza");
    expect(items[1]).toHaveTextContent("Druga");
  });

  it("shows the typing indicator only while sending", () => {
    const { rerender } = render(<MessageList messages={[]} sending={false} />);
    expect(screen.queryByRole("status", { name: "Asystent pisze…" })).not.toBeInTheDocument();

    rerender(<MessageList messages={[]} sending />);
    expect(screen.getByRole("status", { name: "Asystent pisze…" })).toBeInTheDocument();
  });

  it("scrolls to the newest message when messages change", () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = render(<MessageList messages={[msg("1", "user", "a")]} sending={false} />);
    scrollIntoView.mockClear();

    rerender(<MessageList messages={[msg("1", "user", "a"), msg("2", "assistant", "b")]} sending={false} />);

    expect(scrollIntoView).toHaveBeenCalled();
    // @ts-expect-error – sprzątanie stuba po teście
    delete window.HTMLElement.prototype.scrollIntoView;
  });
});
