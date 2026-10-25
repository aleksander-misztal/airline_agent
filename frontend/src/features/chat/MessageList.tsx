import { useEffect, useRef } from "react";
import type { Message } from "../../api";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

type MessageListProps = {
  messages: Message[];
  sending: boolean;
};

export function MessageList({ messages, sending }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <ul aria-label="Wiadomości" className="space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ul>
      {sending && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
