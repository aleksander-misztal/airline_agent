import type { ComponentType } from "react";
import { brand } from "../../config/brand";
import type { Message } from "../../api";
import { messageRenderers } from "./messageRenderers";

type MessageBubbleProps = { message: Message };

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const Renderer = messageRenderers[message.type] as ComponentType<{ message: Message }> | undefined;

  return (
    <li data-role={message.role} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <img src={brand.logo.oryx} alt="" className="size-8 shrink-0 rounded-full bg-brand-50 p-1" />
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-base ${
          isUser ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-neutral-100 text-neutral-900"
        }`}
      >
        <span className="sr-only">{isUser ? "Ty" : "Asystent"}</span>
        {Renderer ? <Renderer message={message} /> : <p className="italic">Nieobsługiwany typ wiadomości</p>}
      </div>
    </li>
  );
}
