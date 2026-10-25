import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "./MessageInput";

const setup = (props: Partial<React.ComponentProps<typeof MessageInput>> = {}) => {
  const onSend = vi.fn().mockResolvedValue(true);
  render(<MessageInput onSend={onSend} {...props} />);
  return { onSend, box: screen.getByRole("textbox", { name: "Wiadomość" }) };
};

describe("MessageInput", () => {
  it("renders a textbox and a send button", () => {
    const { box } = setup();

    expect(box).toHaveAttribute("placeholder", "Napisz wiadomość…");
    expect(screen.getByRole("button", { name: "Wyślij" })).toBeInTheDocument();
  });

  it("sends the trimmed text on Enter and clears the field", async () => {
    const { onSend, box } = setup();

    await userEvent.type(box, "  Cześć  {Enter}");

    expect(onSend).toHaveBeenCalledWith("Cześć");
    expect(box).toHaveValue("");
  });

  it("sends on button click", async () => {
    const { onSend, box } = setup();

    await userEvent.type(box, "Cześć");
    await userEvent.click(screen.getByRole("button", { name: "Wyślij" }));

    expect(onSend).toHaveBeenCalledWith("Cześć");
  });

  it("inserts a new line on Shift+Enter without sending", async () => {
    const { onSend, box } = setup();

    await userEvent.type(box, "a{Shift>}{Enter}{/Shift}b");

    expect(box).toHaveValue("a\nb");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send blank text", async () => {
    const { onSend, box } = setup();

    await userEvent.type(box, "   {Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the send button while the field is empty", async () => {
    const { box } = setup();
    const button = screen.getByRole("button", { name: "Wyślij" });

    expect(button).toBeDisabled();
    await userEvent.type(box, "a");
    expect(button).toBeEnabled();
  });

  it("does not send while disabled", async () => {
    const { onSend, box } = setup({ disabled: true });

    await userEvent.type(box, "Cześć{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Wyślij" })).toBeDisabled();
  });

  it("restores the draft when sending fails", async () => {
    const onSend = vi.fn().mockResolvedValue(false);
    const { box } = setup({ onSend });

    await userEvent.type(box, "Cześć{Enter}");

    expect(box).toHaveValue("Cześć");
  });

  it("does not overwrite a newer draft when sending fails", async () => {
    let finish!: (ok: boolean) => void;
    const onSend = vi.fn().mockReturnValue(new Promise<boolean>((r) => (finish = r)));
    const { box } = setup({ onSend });

    await userEvent.type(box, "Pierwsza{Enter}");
    await userEvent.type(box, "Druga");
    finish(false);

    await vi.waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(box).toHaveValue("Druga");
  });
});
