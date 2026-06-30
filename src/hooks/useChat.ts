import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageModel } from "../types";

/**
 * Drives the SSE chat stream from `/api/chat/stream?question=...`, appending each
 * streamed token to the current assistant message.
 *
 * We read the stream with fetch + a manual SSE parser rather than EventSource on
 * purpose: the backend emits the model's raw tokens as the SSE `data:` payload,
 * and those tokens carry the leading spaces between words (e.g. `data: regulations`).
 * EventSource strips exactly one space after `data:` per the SSE spec, which would
 * collapse every word together ("Theregulationspertainto…"). Parsing the frames
 * ourselves lets us keep the payload verbatim. The stream ends when the backend's
 * reactive publisher completes and closes the connection (reader returns done).
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the component unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback((question: string) => {
    const trimmed = question.trim();
    if (!trimmed || controllerRef.current) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    const appendToLast = (chunk: string) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });

    void (async () => {
      let received = false;
      try {
        const res = await fetch(
          `/api/chat/stream?question=${encodeURIComponent(trimmed)}`,
          { headers: { Accept: "text/event-stream" }, signal: controller.signal },
        );
        if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamDone = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line. Within a frame, join the
          // `data:` lines and keep everything after "data:" verbatim — including
          // a leading space, which belongs to the token, not the framing.
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const lines = frame.split("\n");

            // The backend ends the stream with an `event: done` / `data: [DONE]`
            // frame. Stop on it rather than waiting for the connection to close
            // (which a proxy may hold open, leaving the answer stuck "streaming").
            if (lines.some((line) => line.replace(/\s/g, "") === "event:done")) {
              streamDone = true;
              break;
            }

            const data = lines
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5))
              .join("\n");
            if (data === "[DONE]") {
              streamDone = true;
              break;
            }
            if (data) {
              received = true;
              appendToLast(data);
            }
          }

          if (streamDone) {
            controller.abort(); // release the still-open connection
            break;
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
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
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setIsStreaming(false);
        }
      }
    })();
  }, []);

  return { messages, isStreaming, send };
}
