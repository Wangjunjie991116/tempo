import EventSource from "react-native-sse";
import { TEMPO_API_URL } from "../../core/config/tempoWebConfig";
import type { AiMessage } from "./types";

const DEFAULT_TIMEOUT = 120000;

export type SseEvent = { event: string; data: unknown };

export type ChatRequest = {
  text: string;
  timezone: string;
  locale: string;
  context: {
    currentTime: string;
    availableTags: string[];
  };
  messages?: AiMessage[];
};

export type StreamHandlers = {
  onEvent: (event: SseEvent) => void;
  onError: (error: Error) => void;
  onDone: () => void;
};

export function apiStream(
  path: string,
  body: ChatRequest,
  handlers: StreamHandlers,
  options?: { timeout?: number },
): () => void {
  const url = `${TEMPO_API_URL}${path}`;

  const es = new EventSource<"stage" | "thought" | "command" | "action" | "final" | "done" | "error">(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    pollingInterval: 0,
    timeout: options?.timeout ?? DEFAULT_TIMEOUT,
  });

  const customEventNames = ["stage", "thought", "command", "action", "final", "done"] as const;

  for (const name of customEventNames) {
    es.addEventListener(name, (event: any) => {
      try {
        const data = JSON.parse(event.data);
        handlers.onEvent({ event: name, data });
      } catch {
        handlers.onEvent({ event: name, data: event.data });
      }
      if (name === "done") {
        handlers.onDone();
      }
    });
  }

  es.addEventListener("error", (event: any) => {
    if (event.data != null) {
      try {
        const data = JSON.parse(event.data);
        handlers.onEvent({ event: "error", data });
      } catch {
        handlers.onEvent({ event: "error", data: event.data });
      }
    } else {
      handlers.onError(
        new Error(event.message || "SSE connection error"),
      );
    }
  });

  es.addEventListener("close", () => {
    handlers.onDone();
  });

  let cancelled = false;

  return () => {
    if (cancelled) return;
    cancelled = true;
    es.removeAllEventListeners();
    es.close();
  };
}
