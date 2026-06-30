import { useEffect, useRef } from "react";
import type { ChatMessageModel } from "../types";
import ChatMessage from "./ChatMessage.tsx";

interface Props {
  messages: ChatMessageModel[];
  isStreaming: boolean;
}

export default function ChatWindow({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as tokens stream in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        Ask a question grounded in your uploaded documents.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((message, i) => (
        <ChatMessage
          key={i}
          message={message}
          streaming={isStreaming && i === messages.length - 1}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
