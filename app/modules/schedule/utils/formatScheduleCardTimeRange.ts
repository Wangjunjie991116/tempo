/**
 * 日程卡片副标题：时间段展示（**本地时区**）。不含星期。
 *
 * - 同日：`2026/5/2 12:15 - 16:13`
 * - 跨日：`2026/5/2 12:15 - 2026/5/4 16:13`
 */

import { getScheduleCardTimeSegments } from "./scheduleCardTimeSegments";

/**
 * @param startMs 开始时刻 Unix 毫秒
 * @param endMs 结束时刻 Unix 毫秒；无效或非正时按与开始同一时刻处理
 *
 * @example
 * ```ts
 * const s = new Date(2026, 4, 2, 12, 15).getTime();
 * const e = new Date(2026, 4, 2, 16, 13).getTime();
 * formatScheduleCardTimeRange(s, e); // => "2026/5/2 12:15 - 16:13"
 * ```
 */
export function formatScheduleCardTimeRange(startMs: number, endMs: number): string {
  return getScheduleCardTimeSegments(startMs, endMs)
    .map((s) => s.text)
    .join("");
}

export { getScheduleCardTimeSegments } from "./scheduleCardTimeSegments";
export type { ScheduleCardTimeSegment, ScheduleCardTimeSegmentRole } from "./scheduleCardTimeSegments";
