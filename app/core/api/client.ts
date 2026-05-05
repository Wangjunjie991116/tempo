import axios from "axios";

import { TEMPO_API_URL } from "../config/tempoWebConfig";

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
