import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { authApi } from "../../api";
import { server } from "../../api/mocks/server";
import { ChatPage } from "./ChatPage";

beforeEach(async () => {
  await authApi.login("admin", "admin");
  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>,
  );
});

const box = () => screen.getByRole("textbox", { name: "Wiadomość" });
// Tytuł rozmowy w sidebarze to pierwsza wiadomość, więc treści szukamy tylko w wątku.
const thread = async () => within(await screen.findByRole("list", { name: "Wiadomości" }));

describe("ChatPage", () => {
  it("shows a welcome message and the quick suggestions", () => {
    expect(screen.getByRole("heading", { name: "Czat" })).toBeInTheDocument();
    expect(screen.getByText("W czym mogę pomóc?")).toBeInTheDocument();
    for (const label of ["Status lotu", "Moja rezerwacja", "Bagaż", "Odprawa online"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("sends a message with Enter and shows the user message and the bot reply", async () => {
    await userEvent.type(box(), "Jak zrobić odprawę online?{Enter}");

    expect(await (await thread()).findByText("Jak zrobić odprawę online?")).toBeInTheDocument();
    expect(await (await thread()).findByText(/Odprawa online otwiera się 48 godzin/)).toBeInTheDocument();
    expect(box()).toHaveValue("");
  });

  it("does not send on Shift+Enter", async () => {
    await userEvent.type(box(), "linia 1{Shift>}{Enter}{/Shift}linia 2");

    expect(box()).toHaveValue("linia 1\nlinia 2");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows the typing indicator while waiting for the reply", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", async () => {
        await delay(150);
        const base = { conversationId: "c", createdAt: "2026-11-01T10:00:00Z", type: "text" };
        return HttpResponse.json(
          {
            userMessage: { ...base, id: "u", role: "user", payload: { text: "Cześć" } },
            reply: { ...base, id: "a", role: "assistant", payload: { text: "Witaj!" } },
          },
          { status: 201 },
        );
      }),
    );

    await userEvent.type(box(), "Cześć{Enter}");

    expect(await screen.findByRole("status", { name: "Asystent pisze…" })).toBeInTheDocument();
    expect(await screen.findByText("Witaj!")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Asystent pisze…" })).not.toBeInTheDocument();
  });

  it("clicking a suggestion sends its prompt and the bot answers", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Bagaż" }));

    expect(await (await thread()).findByText("Ile bagażu mogę zabrać?")).toBeInTheDocument();
    expect(await (await thread()).findByText(/Bagaż podręczny: do 7 kg/)).toBeInTheDocument();
  });

  it("hides the welcome screen after the first message", async () => {
    await userEvent.type(box(), "Cześć{Enter}");

    await (await thread()).findByText("Cześć");
    expect(screen.queryByText("W czym mogę pomóc?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Status lotu" })).not.toBeInTheDocument();
  });

  it("renders a flight card for a flight status question", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Status lotu" }));

    expect(await screen.findByText("QR123")).toBeInTheDocument();
    expect(screen.getByText("Planowy")).toBeInTheDocument();
    expect(screen.getByText("B12")).toBeInTheDocument();
  });

  it("shows an error and restores the draft when sending fails", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", () => HttpResponse.json({ error: "Awaria" }, { status: 500 })),
    );

    await userEvent.type(box(), "Cześć{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wysłać wiadomości");
    await waitFor(() => expect(box()).toHaveValue("Cześć"));
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("lets the user dismiss the error message", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", () => HttpResponse.json({ error: "Awaria" }, { status: 500 })),
    );
    await userEvent.type(box(), "Cześć{Enter}");
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: "Zamknij komunikat" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
