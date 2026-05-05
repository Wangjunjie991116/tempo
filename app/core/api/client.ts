import axios from "axios";
import EventSource from "react-native-sse";

import { TEMPO_API_URL } from "../config/tempoWebConfig";
import type { AiMessage } from "../../modules/ai/types";

const DEFAULT_TIMEOUT = 120000;

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

export type ApiEnvelope<T = unknown> = {
  code: number;
  msg: string;
  data?: T;
  traceId: string;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
};

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

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/login", {
    email,
    password,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "login_failed");
  }
  return envelope.data;
}

export async function apiRegister(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "register_failed");
  }
  return envelope.data;
}

export async function apiForgotPassword(email: string): Promise<void> {
  const envelope = await apiPost<ApiEnvelope>("/api/v1/auth/forgot-password", {
    email,
    password: "",
  });
  if (envelope.code !== 0) {
    throw new Error(envelope.msg || "forgot_password_failed");
  }
}

export async function apiResetPassword(email: string, newPassword: string): Promise<AuthUser> {
  const envelope = await apiPost<ApiEnvelope<AuthUser>>("/api/v1/auth/reset-password", {
    email,
    new_password: newPassword,
  });
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.msg || "reset_password_failed");
  }
  return envelope.data;
}

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
