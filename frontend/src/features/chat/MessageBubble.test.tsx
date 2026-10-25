import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../../api";

const base = { id: "m-1", conversationId: "c-1", createdAt: "2026-11-01T10:00:00Z" } as const;

const textMessage = (role: "user" | "assistant", text: string): Message => ({
  ...base,
  role,
  type: "text",
  payload: { text },
});

const flightMessage: Message = {
  ...base,
  role: "assistant",
  type: "flight_card",
  payload: {
    flightNumber: "QR123",
    from: "Warszawa (WAW)",
    to: "Doha (DOH)",
    departure: "2026-11-02T14:35:00+01:00",
    arrival: "2026-11-02T22:50:00+03:00",
    status: "Planowy",
    gate: "B12",
  },
};

describe("MessageBubble", () => {
  it("renders a text message", () => {
    render(<MessageBubble message={textMessage("assistant", "Dzień dobry")} />);

    expect(screen.getByText("Dzień dobry")).toBeInTheDocument();
  });

  it("preserves line breaks in text messages", () => {
    render(<MessageBubble message={textMessage("user", "a\nb")} />);

    expect(screen.getByText(/a\s*b/)).toHaveClass("whitespace-pre-wrap");
  });

  it("marks who wrote the message", () => {
    const { rerender } = render(<MessageBubble message={textMessage("user", "Cześć")} />);
    expect(screen.getByRole("listitem")).toHaveAttribute("data-role", "user");
    expect(screen.getByText("Ty")).toBeInTheDocument();

    rerender(<MessageBubble message={textMessage("assistant", "Cześć")} />);
    expect(screen.getByRole("listitem")).toHaveAttribute("data-role", "assistant");
    expect(screen.getByText("Asystent")).toBeInTheDocument();
  });

  it("renders a flight card", () => {
    render(<MessageBubble message={flightMessage} />);

    expect(screen.getByText("QR123")).toBeInTheDocument();
    expect(screen.getByText("Warszawa (WAW)")).toBeInTheDocument();
    expect(screen.getByText("Doha (DOH)")).toBeInTheDocument();
    expect(screen.getByText("14:35")).toBeInTheDocument();
    expect(screen.getByText("22:50")).toBeInTheDocument();
    expect(screen.getByText("Planowy")).toBeInTheDocument();
    expect(screen.getByText("B12")).toBeInTheDocument();
  });

  it("falls back for an unknown message type", () => {
    const unknown = { ...base, role: "assistant", type: "hologram", payload: {} } as unknown as Message;

    render(<MessageBubble message={unknown} />);

    expect(screen.getByText("Nieobsługiwany typ wiadomości")).toBeInTheDocument();
  });
});
