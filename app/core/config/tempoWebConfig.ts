import Constants from "expo-constants";

type Extra = {
  tempoWebBaseUrl?: string;
  tempoApiBaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as Extra | undefined;

/**
 * WebView 加载的前端基址。解析顺序：`app.config` 注入的 `extra.tempoWebBaseUrl` → `EXPO_PUBLIC_WEB_BASE_URL` → 本地默认端口。
 *
 * @example
 * ```ts
 * // extra.tempoWebBaseUrl = "https://192.168.1.5:5173" → TEMPO_WEB_URL 为该字符串
 * // 均未设置 → "http://127.0.0.1:5174"
 * ```
 */
export const TEMPO_WEB_URL =
  (extra?.tempoWebBaseUrl && extra.tempoWebBaseUrl.trim().length > 0
    ? extra.tempoWebBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_WEB_BASE_URL ??
  "http://127.0.0.1:5174";

/**
 * 后端 API 基址（注入 WebView 的 `window.__TEMPO_CONFIG__` 等）。解析顺序同 {@link TEMPO_WEB_URL}，默认 `8000` 端口。
 *
 * @example
 * ```ts
 * // EXPO_PUBLIC_API_BASE_URL=http://10.0.0.3:8000 → TEMPO_API_URL 为该值
 * ```
 */
export const TEMPO_API_URL =
  (extra?.tempoApiBaseUrl && extra.tempoApiBaseUrl.trim().length > 0
    ? extra.tempoApiBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

/**
 * 在 WebView `injectedJavaScriptBeforeContentLoaded` 中写入全局配置的脚本片段（字符串内嵌 JSON）。
 *
 * @example 注入后页面可读：`window.__TEMPO_CONFIG__.apiBaseUrl`
 */
export const TEMPO_INJECTED_JS_BEFORE_LOAD = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
  apiBaseUrl: TEMPO_API_URL,
})}; true;`;

/**
 * 开发环境下若 Web URL 指向本机 loopback，则为 `true`，用于控制台告警（真机需 LAN IP）。
 */
export const TEMPO_SHOW_LOCALHOST_WEB_HINT =
  __DEV__ &&
  (TEMPO_WEB_URL.includes("127.0.0.1") ||
    TEMPO_WEB_URL.toLowerCase().includes("localhost"));

if (TEMPO_SHOW_LOCALHOST_WEB_HINT) {
  console.warn(
    "[Tempo] WebView URL is localhost. Simulators can use this; physical iPhones: run `pnpm sync:lan-env` at repo root (updates app/.env.dev) or set EXPO_PUBLIC_* to your Mac LAN IP, then expo start --clear",
  );
}
