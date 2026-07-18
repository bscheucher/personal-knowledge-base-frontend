import { useState } from "react";
import { useChat } from "../hooks/useChat.ts";
import ChatWindow from "../components/ChatWindow.tsx";

export default function ChatPage() {
  const { messages, isStreaming, send, cancel } = useChat();
  const [input, setInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <h1 className="mb-4 text-2xl font-semibold">Chat</h1>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <ChatWindow messages={messages} isStreaming={isStreaming} />

        <form
          onSubmit={submit}
          className="flex gap-2 border-t border-slate-200 bg-white p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {isStreaming ? (
            <button type="button" onClick={cancel} className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
