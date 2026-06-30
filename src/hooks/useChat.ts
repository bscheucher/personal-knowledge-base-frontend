import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageModel } from "../types";

/**
 * Drives the SSE chat stream. Opens an EventSource against
 * `/api/chat/stream?question=...` and appends each streamed token to the current
 * assistant message.
 *
 * Note: the backend's Flux completes and closes the connection when the answer is
 * done. EventSource has no "done" event and would otherwise try to reconnect, so
 * we treat the resulting error as end-of-stream and close the source ourselves.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setIsStreaming(false);
  }, []);

  // Tear down any open stream when the component unmounts.
  useEffect(() => close, [close]);

  const send = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || sourceRef.current) return;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      const source = new EventSource(
        `/api/chat/stream?question=${encodeURIComponent(trimmed)}`,
      );
      sourceRef.current = source;
      let received = false;

      source.onmessage = (event) => {
        received = true;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: last.content + event.data,
          };
          return next;
        });
      };

      source.onerror = () => {
        // Stream end (server closed) or a genuine connection failure.
        if (!received) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: "Sorry — the chat stream could not be reached.",
            };
            return next;
          });
        }
        close();
      };
    },
    [close],
  );

  return { messages, isStreaming, send };
}
