import type { ChatMessageModel } from "../types";

export default function ChatMessage({
  message,
  streaming,
}: {
  message: ChatMessageModel;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        {message.content}
        {streaming && message.content === "" && (
          <span className="text-slate-400">Thinking…</span>
        )}
        {streaming && message.content !== "" && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-middle" />
        )}
        {message.delivery === "interrupted" && (
          <div className="mt-2 text-xs font-medium text-amber-700" role="status">
            Answer interrupted
          </div>
        )}
      </div>
    </div>
  );
}
