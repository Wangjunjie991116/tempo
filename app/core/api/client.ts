import axios from "axios";
import EventSource from "react-native-sse";

import { TEMPO_API_URL } from "../config/tempoWebConfig";

const DEFAULT_TIMEOUT = 30000;

const apiClient = axios.create({
  baseURL: TEMPO_API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ApiError = {
  code: number;
  message: string;
};

export type SseEvent = { event: string; data: unknown };

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { timeout?: number },
): Promise<T> {
  const response = await apiClient.post<T>(path, body, {
    timeout: options?.timeout,
  });
  return response.data;
}

export type StreamHandlers = {
  onEvent: (event: SseEvent) => void;
  onError: (error: Error) => void;
  onDone: () => void;
};

export function apiStream(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
  options?: { timeout?: number },
): () => void {
  const url = `${TEMPO_API_URL}${path}`;

  const es = new EventSource<"stage" | "thought" | "command" | "done" | "error">(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    pollingInterval: 0,
    timeout: options?.timeout ?? DEFAULT_TIMEOUT,
  });

  const customEventNames = ["stage", "thought", "command", "done"] as const;

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

  // react-native-sse dispatches both server-sent "event: error" and connection
  // errors through the same "error" listener. We distinguish them at runtime
  // by checking whether "data" is present (server event) or absent (connection error).
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
