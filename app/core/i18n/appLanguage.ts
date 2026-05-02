import AsyncStorage from "@react-native-async-storage/async-storage";

import i18n from "i18next";

import { resolveInitialLanguage } from "./config";
import type { AppLanguage } from "./languagePreference";
import { FIXED_APP_LANGUAGE } from "./languagePreference";

const STORAGE_KEY = "@tempo/app_language";

function isAppLanguage(value: string): value is AppLanguage {
  return value === "en" || value === "zh";
}

/**
 * 启动时调用：
 * - 若配置了 {@link FIXED_APP_LANGUAGE}，强制使用该语言；
 * - 否则：本地存有 `en`/`zh` 则用之，否则按 {@link resolveInitialLanguage} 跟随设备。
 *
 * @example
 * ```ts
 * await bootstrapAppLanguage();
 * ```
 */
export async function bootstrapAppLanguage(): Promise<void> {
  if (FIXED_APP_LANGUAGE != null) {
    await i18n.changeLanguage(FIXED_APP_LANGUAGE);
    return;
  }
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isAppLanguage(stored)) {
      await i18n.changeLanguage(stored);
      return;
    }
  } catch {
    // ignore read errors — fall through to device
  }
  await i18n.changeLanguage(resolveInitialLanguage());
}

/**
 * 代码侧切换界面语言；默认写入本地，下次启动仍生效。
 *
 * @param lng `zh` | `en`
 * @param options.persist 为 `false` 时不写入 AsyncStorage（仅本次进程内生效，重启后仍按 bootstrap 规则）。
 *
 * @example
 * ```ts
 * await setAppLanguage("zh");
 * await setAppLanguage("en", { persist: false });
 * ```
 */
export async function setAppLanguage(
  lng: AppLanguage,
  options?: { persist?: boolean },
): Promise<void> {
  const persist = options?.persist ?? true;
  await i18n.changeLanguage(lng);
  try {
    if (persist) {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    }
  } catch {
    // ignore
  }
}

/**
 * 清除 AsyncStorage 中的语言偏好。
 * 若 {@link FIXED_APP_LANGUAGE} 非空则回到该固定语言，否则按 **当前设备** 首选语言。
 */
export async function resetAppLanguageToDevice(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const lng = FIXED_APP_LANGUAGE ?? resolveInitialLanguage();
  await i18n.changeLanguage(lng);
}
