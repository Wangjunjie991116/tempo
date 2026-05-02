import { useMemo } from "react";

export type NotificationSegment = "activity" | "system";

export interface NotificationRow {
  id: string;
  title: string;
  subtitle: string;
}

const MOCK_ACTIVITY_EN: NotificationRow[] = [
  {
    id: "n-act-1",
    title: "Design review reminder",
    subtitle: "Project Design Discussion starts in 24 hours.",
  },
  {
    id: "n-act-2",
    title: "Workshop RSVP confirmed",
    subtitle: "You're signed up for Leadership Training 101.",
  },
];

/** System 分段默认空列表 —— 用于驱动该 Tab 的空状态 UI。 */
const MOCK_SYSTEM_EN: NotificationRow[] = [];

/**
 * 按收件箱 Tab 分段返回 **静态 Mock** 列表（后续可替换为真实数据源）。
 *
 * @param segment `"activity"` | `"system"`
 * @returns 该分段下的通知行数组
 *
 * @example
 * ```tsx
 * const rows = useNotificationFeed("activity"); // Mock 英文两条
 * const empty = useNotificationFeed("system");   // []
 * ```
 */
export function useNotificationFeed(segment: NotificationSegment): NotificationRow[] {
  return useMemo(
    () => (segment === "activity" ? MOCK_ACTIVITY_EN : MOCK_SYSTEM_EN),
    [segment],
  );
}
