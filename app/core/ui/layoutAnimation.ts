import { LayoutAnimation, Platform, UIManager } from "react-native";

/**
 * 在 Android 上启用 `LayoutAnimation` 实验开关（官方文档要求调用一次）。
 *
 * @example
 * ```ts
 * // 一般在 App 根部挂载导航前调用一次即可
 * enableAndroidLayoutAnimationExperimental();
 * ```
 */
export function enableAndroidLayoutAnimationExperimental(): void {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

/**
 * 为 **下一次** 布局变更配置「缓入缓出」列表过渡动画（常用于日程列表切换日时）。
 *
 * @example
 * ```ts
 * easeListTransition();
 * setSelectedDay(nextDay); // 紧随其后的列表重排会带动画
 * ```
 */
export function easeListTransition(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
