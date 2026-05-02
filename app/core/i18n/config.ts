import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import common from "./locales/en/common.json";
import notifications from "./locales/en/notifications.json";
import schedule from "./locales/en/schedule.json";

/** i18next `resources` 形态：当前仅挂载英文 bundle（键与命名空间对齐）。 */
export const resources = {
  en: { common, schedule, notifications },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
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
  return Localization.getLocales()[0]?.languageTag ?? "en";
}

export default i18n;
