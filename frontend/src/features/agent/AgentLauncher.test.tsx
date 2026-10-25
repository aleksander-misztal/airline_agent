import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { authApi, chatApi } from "../../api";
import { server } from "../../api/mocks/server";
import { useChatStore } from "../chat/chatStore";
import { AgentLauncher } from "./AgentLauncher";

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

const renderLauncher = (path = "/dashboard") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AgentLauncher />
    </MemoryRouter>,
  );

const icon = () => screen.getByRole("button", { name: "Otwórz asystenta" });
const dialog = () => within(screen.getByRole("dialog", { name: "Asystent" }));
const thread = () => dialog().getByRole("list", { name: "Wiadomości" });
const input = () => dialog().getByRole("textbox", { name: "Wiadomość" });

async function openPopup(path?: string) {
  renderLauncher(path);
  await userEvent.click(icon());
}

describe("AgentLauncher – icon", () => {
  it("shows the round icon on the dashboard and on the flight search", () => {
    renderLauncher("/dashboard");
    expect(icon()).toBeInTheDocument();
  });

  it("shows it on the flight search too", () => {
    renderLauncher("/flights");
    expect(icon()).toBeInTheDocument();
  });

  it("is hidden on the Asystent page, which has the full chat", () => {
    renderLauncher("/chat");

    expect(screen.queryByRole("button", { name: "Otwórz asystenta" })).not.toBeInTheDocument();
  });

  it("does not show the dialog until the icon is clicked", () => {
    renderLauncher();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AgentLauncher – popup", () => {
  it("opens a dialog with the welcome screen and puts the cursor in the input", async () => {
    await openPopup();

    expect(dialog().getByText("W czym mogę pomóc?")).toBeInTheDocument();
    expect(input()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Otwórz asystenta" })).not.toBeInTheDocument();
  });

  it("offers suggestions that fit the dashboard", async () => {
    await openPopup("/dashboard");

    for (const label of ["Saldo Avios", "Moje rezerwacje", "Status lotu", "Odprawa online"]) {
      expect(dialog().getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("offers suggestions that fit the flight search", async () => {
    await openPopup("/flights");

    for (const label of ["Klasy podróży", "Bagaż w mojej klasie", "Zmiana daty", "Podróż z dzieckiem"]) {
      expect(dialog().getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("answers a typed question", async () => {
    await openPopup();

    await userEvent.type(input(), "Jak zrobić odprawę online?{Enter}");

    expect(await within(thread()).findByText("Jak zrobić odprawę online?")).toBeInTheDocument();
    expect(await within(thread()).findByText(/Odprawa online otwiera się 48 godzin/)).toBeInTheDocument();
  });

  it("answers a suggestion with a flight card", async () => {
    await openPopup("/dashboard");

    await userEvent.click(dialog().getByRole("button", { name: "Status lotu" }));

    expect(await within(thread()).findByText("QR123", { exact: true })).toBeInTheDocument();
    expect(within(thread()).getByText("Planowy")).toBeInTheDocument();
  });

  it("answers the flight search suggestions", async () => {
    await openPopup("/flights");

    await userEvent.click(dialog().getByRole("button", { name: "Klasy podróży" }));

    expect(await within(thread()).findByText(/leżące fotele/)).toBeInTheDocument();
  });

  it("shows an error that can be dismissed", async () => {
    server.use(
      http.post("*/api/conversations/:id/messages", () => HttpResponse.json({ error: "Awaria" }, { status: 500 })),
    );
    await openPopup();

    await userEvent.type(input(), "Cześć{Enter}");

    expect(await dialog().findByRole("alert")).toHaveTextContent("Nie udało się wysłać wiadomości");
    await userEvent.click(dialog().getByRole("button", { name: "Zamknij komunikat" }));
    expect(dialog().queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AgentLauncher – conversation", () => {
  it("starts a new conversation instead of inheriting the one open in the Asystent tab", async () => {
    await useChatStore.getState().sendMessage("Wcześniejsza rozmowa");
    expect(useChatStore.getState().messages).toHaveLength(2);

    await openPopup();

    expect(dialog().getByText("W czym mogę pomóc?")).toBeInTheDocument();
    expect(dialog().queryByRole("list", { name: "Wiadomości" })).not.toBeInTheDocument();
    await expect(chatApi.listConversations()).resolves.toHaveLength(1);
  });

  it("saves the popup chat as a regular conversation", async () => {
    await openPopup();

    await userEvent.type(input(), "Ile bagażu mogę zabrać?{Enter}");
    await within(thread()).findByText(/Bagaż podręczny: do 7 kg/);

    const [conversation] = await chatApi.listConversations();
    expect(conversation.title).toBe("Ile bagażu mogę zabrać?");
    expect(useChatStore.getState().conversationId).toBe(conversation.id);
  });

  it("keeps the conversation when the popup is closed and reopened", async () => {
    await openPopup();
    await userEvent.type(input(), "Cześć{Enter}");
    await within(thread()).findByText("Cześć");

    await userEvent.click(dialog().getByRole("button", { name: "Zamknij asystenta" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(icon());

    expect(within(thread()).getByText("Cześć")).toBeInTheDocument();
  });

  it("starts another conversation with the “Nowa rozmowa” button", async () => {
    await openPopup();
    await userEvent.type(input(), "Pierwsza{Enter}");
    await within(thread()).findByText("Pierwsza");

    await userEvent.click(dialog().getByRole("button", { name: "Nowa rozmowa" }));

    expect(dialog().getByText("W czym mogę pomóc?")).toBeInTheDocument();
    expect(input()).toHaveFocus();
    await userEvent.type(input(), "Druga{Enter}");
    await within(thread()).findByText("Druga");
    await expect(chatApi.listConversations()).resolves.toHaveLength(2);
  });
});

describe("AgentLauncher – closing", () => {
  it("closes with Escape and returns focus to the icon", async () => {
    await openPopup();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(icon()).toHaveFocus();
  });

  it("closes with the close button and returns focus to the icon", async () => {
    await openPopup();

    await userEvent.click(dialog().getByRole("button", { name: "Zamknij asystenta" }));

    expect(icon()).toHaveFocus();
  });
});
