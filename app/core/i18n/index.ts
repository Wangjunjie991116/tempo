/** 初始化 i18next（副作用）并再导出 `react-i18next` API。 */
import "./config";

export { default as i18n } from "i18next";
export { useTranslation } from "react-i18next";
