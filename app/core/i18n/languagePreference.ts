/**
 * 全局界面语言偏好（集中配置，避免与 `config` / `appLanguage` 循环依赖）。
 *
 * {@link FIXED_APP_LANGUAGE} 非空时：**忽略设备与 AsyncStorage**，启动与 bootstrap 均使用该语言。
 * 设为 `null` 后才会走「持久化偏好 → 设备语言」逻辑。
 */
export type AppLanguage = "en" | "zh";

/** 当前写死为英文；改为 `null` 即可恢复自动（存储 → 设备）。 */
export const FIXED_APP_LANGUAGE: AppLanguage | null = "en";
