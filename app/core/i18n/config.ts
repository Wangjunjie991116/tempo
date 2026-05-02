import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import commonEn from "./locales/en/common.json";
import notificationsEn from "./locales/en/notifications.json";
import scheduleEn from "./locales/en/schedule.json";
import commonZh from "./locales/zh/common.json";
import notificationsZh from "./locales/zh/notifications.json";
import scheduleZh from "./locales/zh/schedule.json";
import { FIXED_APP_LANGUAGE } from "./languagePreference";

/** i18next `resources`：`en` / `zh` 命名空间与键一致；缺失键回退 {@link fallbackLng}。 */
export const resources = {
  en: {
    common: commonEn,
    schedule: scheduleEn,
    notifications: notificationsEn,
  },
  zh: {
    common: commonZh,
    schedule: scheduleZh,
    notifications: notificationsZh,
  },
} as const;

const fallbackLng = "en";

/**
 * 设备首选语言为中文（含 zh-Hans / zh-Hant）时使用 `zh`，否则 **默认英文** `en`。
 *
 * @example
 * ```ts
 * resolveInitialLanguage(); // => "en" | "zh"
 * ```
 */
export function resolveInitialLanguage(): keyof typeof resources {
  const code = (Localization.getLocales()[0]?.languageCode ?? fallbackLng).toLowerCase();
  if (code === "zh" || code.startsWith("zh-")) return "zh";
  return "en";
}

/** 同步初值：`FIXED_APP_LANGUAGE` 优先，否则与设备一致；冷启动后由 {@link bootstrapAppLanguage} 再对齐（未固定时读存储）。 */
void i18n.use(initReactI18next).init({
  resources,
  lng: FIXED_APP_LANGUAGE ?? resolveInitialLanguage(),
  fallbackLng,
  supportedLngs: ["en", "zh"],
  interpolation: { escapeValue: false },
  defaultNS: "common",
  ns: ["common", "schedule", "notifications"],
});

/**
 * 读取设备当前首选 locale 的 **BCP 47** 标签（如 `en-US`）；无数据时回退 `en`。
 *
 * @example
 * ```ts
 * getDeviceLocaleTag(); // => "en-US" | "zh-CN" | ...
 * ```
 */
export function getDeviceLocaleTag(): string {
  return Localization.getLocales()[0]?.languageTag ?? fallbackLng;
}

export default i18n;
