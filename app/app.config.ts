import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { ExpoConfig, ConfigContext } from "expo/config";

const appRoot = __dirname;

loadEnv({ path: path.join(appRoot, ".env"), override: true });
loadEnv({ path: path.join(appRoot, ".env.local"), override: true });
loadEnv({ path: path.join(appRoot, ".env.dev"), override: true });

/**
 * Expo 动态配置：合并 `app.json` 基底，注入 dotenv 中的 Web/API 基址到 `extra`，并追加插件。
 *
 * @param config Expo 从 `app.json` 读入的上下文配置
 * @returns 最终 `ExpoConfig`（供 `expo start` / EAS 使用）
 *
 * @example
 * `EXPO_PUBLIC_WEB_BASE_URL` → `extra.tempoWebBaseUrl`，供 {@link TEMPO_WEB_URL} 读取。
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const web = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "";
  const api = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

  const existingPlugins = (config.plugins ?? []) as NonNullable<ExpoConfig["plugins"]>;

  return {
    ...config,
    name: config.name ?? "Tempo",
    slug: config.slug ?? "Tempo",
    plugins: [...existingPlugins, "expo-font", "expo-localization"],
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocalNetworkUsageDescription:
          "轻程（Tempo）需要从你的 Mac 加载本地开发页面（WebView），请在提示时允许访问本地网络。",
      },
    },
    extra: {
      ...((config.extra as Record<string, unknown> | undefined) ?? {}),
      tempoWebBaseUrl: web,
      tempoApiBaseUrl: api,
    },
  };
};
