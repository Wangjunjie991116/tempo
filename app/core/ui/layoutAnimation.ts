import { LayoutAnimation, Platform, UIManager } from "react-native";

/** Android requires this once for `LayoutAnimation` on layout changes (RN docs). */
export function enableAndroidLayoutAnimationExperimental(): void {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export function easeListTransition(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
