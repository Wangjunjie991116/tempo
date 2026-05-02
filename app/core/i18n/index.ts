/** 初始化 i18next（副作用）并再导出 `react-i18next` API。 */
import "./config";

export type { AppLanguage } from "./languagePreference";
export { FIXED_APP_LANGUAGE } from "./languagePreference";
export {
  bootstrapAppLanguage,
  resetAppLanguageToDevice,
  setAppLanguage,
} from "./appLanguage";
export { getDeviceLocaleTag, resolveInitialLanguage } from "./config";
export { default as i18n } from "i18next";
export { useTranslation } from "react-i18next";
