import { useCallback, useEffect, useRef, useState } from "react";
import { SseParser, type SseEvent } from "../api/sseParser.ts";
import type { ChatMessageModel } from "../types";

const STORAGE_KEY = "base.chat.messages";
const START_ERROR = "Sorry — the answer could not be started.";
const INTERRUPTED_ERROR = "The answer stream was interrupted.";

function loadMessages(): ChatMessageModel[] {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as ChatMessageModel[]) : [];
  } catch {
    return [];
  }
}

async function problemMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; title?: string };
    return body.detail || body.title || `${START_ERROR} (${response.status})`;
  } catch {
    return `${START_ERROR} (${response.status})`;
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageModel[]>(loadMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);

  const updateMessages = useCallback(
    (update: (current: ChatMessageModel[]) => ChatMessageModel[]) => {
      setMessages((current) => {
        const next = update(current);
        messagesRef.current = next;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const interruptLast = useCallback(
    (message = INTERRUPTED_ERROR) => {
      updateMessages((current) => {
        const next = [...current];
        const last = next.at(-1);
        if (!last || last.role !== "assistant" || last.delivery === "complete") return current;
        next[next.length - 1] = {
          ...last,
          content: last.content || message,
          delivery: "interrupted",
        };
        return next;
      });
    },
    [updateMessages],
  );

  useEffect(
    () => () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        const current = [...messagesRef.current];
        const last = current.at(-1);
        if (last?.role === "assistant" && last.delivery !== "complete") {
          current[current.length - 1] = {
            ...last,
            content: last.content || INTERRUPTED_ERROR,
            delivery: "interrupted",
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        }
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    if (!controllerRef.current) return;
    interruptLast();
    controllerRef.current.abort();
  }, [interruptLast]);

  const send = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || controllerRef.current) return;

      updateMessages((current) => [
        ...current,
        { role: "user", content: trimmed },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);
      const controller = new AbortController();
      controllerRef.current = controller;

      const appendToken = (text: string) =>
        updateMessages((current) => {
          const next = [...current];
          const last = next.at(-1);
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + text };
          }
          return next;
        });

      void (async () => {
        let receivedToken = false;
        let terminalEvent = false;
        const handleEvent = (event: SseEvent) => {
          if (event.event === "token") {
            const payload = JSON.parse(event.data) as { text?: unknown };
            if (typeof payload.text !== "string") throw new Error("Invalid token event");
            receivedToken = true;
            appendToken(payload.text);
          } else if (event.event === "done") {
            terminalEvent = true;
            updateMessages((current) => {
              const next = [...current];
              const last = next.at(-1);
              if (last?.role === "assistant") next[next.length - 1] = { ...last, delivery: "complete" };
              return next;
            });
          } else if (event.event === "error") {
            terminalEvent = true;
            const payload = JSON.parse(event.data) as { message?: string };
            interruptLast(payload.message || INTERRUPTED_ERROR);
          }
        };

        try {
          const response = await fetch(`/api/chat/stream?question=${encodeURIComponent(trimmed)}`, {
            headers: { Accept: "text/event-stream" },
            signal: controller.signal,
          });
          if (!response.ok) {
            const message = await problemMessage(response);
            updateMessages((current) => {
              const next = [...current];
              next[next.length - 1] = { role: "assistant", content: message, delivery: "interrupted" };
              return next;
            });
            terminalEvent = true;
            return;
          }
          if (!response.body) throw new Error("Missing response body");

          const reader = response.body.getReader();
          const parser = new SseParser();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const event of parser.push(value)) handleEvent(event);
            if (terminalEvent) {
              await reader.cancel();
              break;
            }
          }
          if (!terminalEvent) {
            for (const event of parser.finish()) handleEvent(event);
          }
          if (!terminalEvent) interruptLast();
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            interruptLast(receivedToken ? INTERRUPTED_ERROR : START_ERROR);
          }
        } finally {
          if (controllerRef.current === controller) {
            controllerRef.current = null;
            setIsStreaming(false);
          }
        }
      })();
    },
    [interruptLast, updateMessages],
  );

  return { messages, isStreaming, send, cancel };
}
