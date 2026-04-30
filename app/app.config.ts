import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { ExpoConfig, ConfigContext } from "expo/config";

const appRoot = __dirname;

loadEnv({ path: path.join(appRoot, ".env"), override: true });
loadEnv({ path: path.join(appRoot, ".env.local"), override: true });

export default ({ config }: ConfigContext): ExpoConfig => {
  const web = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "";
  const api = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

  return {
    ...config,
    name: config.name ?? "Tempo",
    slug: config.slug ?? "tempo",
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
