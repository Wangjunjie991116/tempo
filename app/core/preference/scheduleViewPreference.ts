import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@tempo/schedule_view_style";

/** 日程视图风格：卡片类型（原时间轴列表）| 时间线类型（原精简日程 / iOS 风格） */
export type ScheduleViewStyle = "card" | "timeline";

const VALID_STYLES: ScheduleViewStyle[] = ["card", "timeline"];

function isScheduleViewStyle(value: string): value is ScheduleViewStyle {
  return VALID_STYLES.includes(value as ScheduleViewStyle);
}

let _cachedStyle: ScheduleViewStyle = "timeline";

const listeners = new Set<(style: ScheduleViewStyle) => void>();

function notify(style: ScheduleViewStyle): void {
  listeners.forEach((cb) => cb(style));
}

/**
 * 订阅日程视图风格变更。
 *
 * @returns 取消订阅函数
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeScheduleViewStyle((style) => {
 *   console.log("view style changed to", style);
 * });
 * ```
 */
export function subscribeScheduleViewStyle(
  callback: (style: ScheduleViewStyle) => void,
): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * 启动时读取日程视图偏好；无记录时默认使用 `timeline`。
 *
 * @example
 * ```ts
 * const style = await bootstrapScheduleViewStyle();
 * ```
 */
export async function bootstrapScheduleViewStyle(): Promise<ScheduleViewStyle> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isScheduleViewStyle(stored)) {
      _cachedStyle = stored;
      return stored;
    }
  } catch {
    // ignore read errors
  }
  _cachedStyle = "timeline";
  return "timeline";
}

/**
 * 切换并持久化日程视图风格；变更后会通知所有订阅者。
 *
 * @example
 * ```ts
 * await setScheduleViewStyle("timeline");
 * ```
 */
export async function setScheduleViewStyle(
  style: ScheduleViewStyle,
): Promise<void> {
  _cachedStyle = style;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, style);
  } catch {
    // ignore write errors
  }
  notify(style);
}

/**
 * 读取当前日程视图风格（同步，依赖启动时 {@link bootstrapScheduleViewStyle} 的缓存）。
 *
 * @example
 * ```ts
 * const style = getScheduleViewStyle();
 * ```
 */
export function getScheduleViewStyle(): ScheduleViewStyle {
  return _cachedStyle;
}
