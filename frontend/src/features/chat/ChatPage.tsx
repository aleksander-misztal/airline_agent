import { brand } from "../../config/brand";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { SuggestionChips } from "./SuggestionChips";
import { useChatStore } from "./chatStore";

export function ChatPage() {
  const messages = useChatStore((s) => s.messages);
  const sending = useChatStore((s) => s.sending);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
      <h1 className="sr-only">Czat</h1>

      <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200">
        {messages.length > 0 ? (
          <MessageList messages={messages} sending={sending} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8 text-center">
            <img src={brand.logo.oryx} alt="" className="size-20" />
            <div>
              <h2 className="text-3xl font-light text-brand">Dzień dobry!</h2>
              <p className="mt-1 text-lg text-brand-gray">W czym mogę pomóc?</p>
            </div>
            <SuggestionChips onSelect={(prompt) => void sendMessage(prompt)} disabled={sending} />
          </div>
        )}

        {error && (
          <p role="alert" className="mx-4 mb-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="border-t border-neutral-200 p-3">
          <MessageInput onSend={sendMessage} disabled={sending} />
        </div>
      </div>
    </div>
  );
}
