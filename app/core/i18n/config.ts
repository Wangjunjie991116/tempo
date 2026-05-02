import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import common from "./locales/en/common.json";
import notifications from "./locales/en/notifications.json";
import schedule from "./locales/en/schedule.json";

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

export function getDeviceLocaleTag(): string {
  return Localization.getLocales()[0]?.languageTag ?? "en";
}

export default i18n;
