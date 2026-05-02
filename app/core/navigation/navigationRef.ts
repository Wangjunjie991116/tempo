import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/**
 * 根导航容器引用：可在 React 组件树外执行 `navigationRef.navigate(...)`（需容器已挂载且有路由）。
 *
 * @example
 * ```ts
 * if (navigationRef.isReady()) navigationRef.navigate("Main", { screen: "Schedule" });
 * ```
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
