import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { authApi, chatApi } from "../../api";
import { ChatPage } from "./ChatPage";

async function seed(text: string) {
  const conversation = await chatApi.createConversation();
  await chatApi.sendMessage(conversation.id, text);
  return conversation;
}

const renderChat = () =>
  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>,
  );

const sidebar = () => within(screen.getByRole("navigation", { name: "Rozmowy" }));
const thread = () => within(screen.getByRole("list", { name: "Wiadomości" }));
const box = () => screen.getByRole("textbox", { name: "Wiadomość" });

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

describe("ChatPage – conversations sidebar", () => {
  it("shows an empty state when there are no conversations", async () => {
    renderChat();

    expect(await sidebar().findByText("Brak zapisanych rozmów")).toBeInTheDocument();
  });

  it("lists existing conversations on load", async () => {
    await seed("Jak zrobić odprawę online?");
    await seed("Ile bagażu mogę zabrać?");

    renderChat();

    expect(await sidebar().findByRole("button", { name: "Ile bagażu mogę zabrać?" })).toBeInTheDocument();
    expect(sidebar().getByRole("button", { name: "Jak zrobić odprawę online?" })).toBeInTheDocument();
  });

  it("opens a conversation and shows its messages", async () => {
    await seed("Jak zrobić odprawę online?");
    renderChat();

    await userEvent.click(await sidebar().findByRole("button", { name: "Jak zrobić odprawę online?" }));

    expect(await thread().findByText("Jak zrobić odprawę online?")).toBeInTheDocument();
    expect(thread().getByText(/Odprawa online otwiera się 48 godzin/)).toBeInTheDocument();
    expect(screen.queryByText("W czym mogę pomóc?")).not.toBeInTheDocument();
  });

  it("continues the opened conversation", async () => {
    await seed("Jak zrobić odprawę online?");
    renderChat();
    await userEvent.click(await sidebar().findByRole("button", { name: "Jak zrobić odprawę online?" }));
    await thread().findByText("Jak zrobić odprawę online?");

    await userEvent.type(box(), "Ile bagażu mogę zabrać?{Enter}");

    expect(await thread().findByText(/Bagaż podręczny: do 7 kg/)).toBeInTheDocument();
    expect(thread().getAllByRole("listitem")).toHaveLength(4);
    expect(sidebar().getAllByRole("listitem")).toHaveLength(1);
  });

  it("adds a new conversation to the sidebar after the first message", async () => {
    renderChat();

    await userEvent.type(box(), "Jak zrobić odprawę online?{Enter}");

    const item = await sidebar().findByRole("button", { name: "Jak zrobić odprawę online?" });
    expect(item).toHaveAttribute("aria-current", "true");
  });

  it("“Nowa rozmowa” returns to the welcome screen and keeps the old one in the list", async () => {
    renderChat();
    await userEvent.type(box(), "Cześć{Enter}");
    await sidebar().findByRole("button", { name: "Cześć" });

    await userEvent.click(sidebar().getByRole("button", { name: "Nowa rozmowa" }));

    expect(screen.getByText("W czym mogę pomóc?")).toBeInTheDocument();
    expect(sidebar().getByRole("button", { name: "Cześć" })).not.toHaveAttribute("aria-current");
  });

  it("starting a new conversation creates a separate one", async () => {
    renderChat();
    await userEvent.type(box(), "Pierwsza{Enter}");
    await sidebar().findByRole("button", { name: "Pierwsza" });
    await userEvent.click(sidebar().getByRole("button", { name: "Nowa rozmowa" }));

    await userEvent.type(box(), "Druga{Enter}");

    await sidebar().findByRole("button", { name: "Druga" });
    expect(sidebar().getAllByRole("listitem")).toHaveLength(2);
  });

  it("deleting the active conversation clears the chat", async () => {
    renderChat();
    await userEvent.type(box(), "Cześć{Enter}");
    await sidebar().findByRole("button", { name: "Cześć" });

    await userEvent.click(sidebar().getByRole("button", { name: "Usuń rozmowę: Cześć" }));

    expect(await screen.findByText("W czym mogę pomóc?")).toBeInTheDocument();
    expect(sidebar().getByText("Brak zapisanych rozmów")).toBeInTheDocument();
  });

  it("deleting another conversation keeps the current chat", async () => {
    await seed("Jak zrobić odprawę online?");
    renderChat();
    await userEvent.type(box(), "Cześć{Enter}");
    await sidebar().findByRole("button", { name: "Cześć" });

    await userEvent.click(sidebar().getByRole("button", { name: "Usuń rozmowę: Jak zrobić odprawę online?" }));

    await vi.waitFor(() =>
      expect(sidebar().queryByRole("button", { name: "Jak zrobić odprawę online?" })).not.toBeInTheDocument(),
    );
    expect(thread().getByText("Cześć")).toBeInTheDocument();
  });

  it("toggles the conversations drawer on small screens", async () => {
    renderChat();
    const toggle = screen.getByRole("button", { name: "Rozmowy" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the drawer after choosing a conversation", async () => {
    await seed("Jak zrobić odprawę online?");
    renderChat();
    const toggle = screen.getByRole("button", { name: "Rozmowy" });
    await userEvent.click(toggle);

    await userEvent.click(await sidebar().findByRole("button", { name: "Jak zrobić odprawę online?" }));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
