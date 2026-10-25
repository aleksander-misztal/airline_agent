import type { ComponentType } from "react";
import { brand } from "../../config/brand";
import type { Message } from "../../api";
import { messageRenderers } from "./messageRenderers";

type MessageBubbleProps = { message: Message };

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  // Karty i inne bogate treści mają własną ramkę – bez dodatkowej bańki.
  const bubbleClass = isUser
    ? "rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-white"
    : message.type === "text"
      ? "rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2.5 text-neutral-900"
      : "text-neutral-900";
  const Renderer = messageRenderers[message.type] as ComponentType<{ message: Message }> | undefined;

  return (
    <li data-role={message.role} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <img src={brand.logo.oryx} alt="" className="size-8 shrink-0 rounded-full bg-brand-50 p-1" />
      )}
      <div className={`max-w-[85%] text-base ${bubbleClass}`}>
        <span className="sr-only">{isUser ? "Ty" : "Asystent"}</span>
        {Renderer ? <Renderer message={message} /> : <p className="italic">Nieobsługiwany typ wiadomości</p>}
      </div>
    </li>
  );
}
