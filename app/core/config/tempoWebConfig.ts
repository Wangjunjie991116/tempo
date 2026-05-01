import Constants from "expo-constants";

type Extra = {
  tempoWebBaseUrl?: string;
  tempoApiBaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as Extra | undefined;

export const TEMPO_WEB_URL =
  (extra?.tempoWebBaseUrl && extra.tempoWebBaseUrl.trim().length > 0
    ? extra.tempoWebBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_WEB_BASE_URL ??
  "http://127.0.0.1:5173";

export const TEMPO_API_URL =
  (extra?.tempoApiBaseUrl && extra.tempoApiBaseUrl.trim().length > 0
    ? extra.tempoApiBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export const TEMPO_INJECTED_JS_BEFORE_LOAD = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
  apiBaseUrl: TEMPO_API_URL,
})}; true;`;

export const TEMPO_SHOW_LOCALHOST_WEB_HINT =
  __DEV__ &&
  (TEMPO_WEB_URL.includes("127.0.0.1") ||
    TEMPO_WEB_URL.toLowerCase().includes("localhost"));

if (TEMPO_SHOW_LOCALHOST_WEB_HINT) {
  console.warn(
    "[Tempo] WebView URL is localhost. Simulators can use this; physical iPhones need app/.env with EXPO_PUBLIC_* set to your Mac LAN IP. After creating/editing app/.env run: expo start --clear",
  );
}
