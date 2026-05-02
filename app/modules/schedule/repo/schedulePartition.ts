import type { ScheduleItem } from "./types";

/**
 * 判断 ISO 8601 字符串所表示的瞬间，其 **本地日历日** 是否与锚定日 `anchor` 同一天。
 *
 * @param iso `ScheduleItem.startAt` / `endAt` 等存储用 ISO 字符串
 * @param anchor 页面选中的「日历日」（通常为当日 0 点的 Date）
 *
 * @example
 * ```ts
 * // UTC 2026-05-02 09:00 → 在东八区常为本地 2026-05-02 17:00，仍为同一本地日
 * sameLocalDayIso("2026-05-02T09:00:00.000Z", new Date(2026, 4, 2)); // 多数时区为 true
 * ```
 */
function sameLocalDayIso(iso: string, anchor: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === anchor.getFullYear() &&
    d.getMonth() === anchor.getMonth() &&
    d.getDate() === anchor.getDate()
  );
}

/**
 * 将全量日程列表按「某一天」拆成 **未完成 / 已完成** 两段（均为本地日历语义）。
 *
 * - **upcoming**：`status === "upcoming"` 且 `startAt` 落在 `day` 当天。
 * - **finished**：`status === "finished"`，归属日以 **`endAt` 优先**，若无有效 `endAt` 则用 `startAt`。
 *
 * @param items 仓储返回的全量数组（或内存中的副本）
 * @param day 当前分页 / 日期条选中的本地日
 *
 * @example
 * ```ts
 * const day = new Date(2026, 4, 2); // 2026-05-02 本地
 * partitionScheduleForDay(allItems, day);
 * // => { upcoming: [...], finished: [...] } // 仅含该本地日内的条目
 * ```
 */
export function partitionScheduleForDay(
  items: ScheduleItem[],
  day: Date,
): { upcoming: ScheduleItem[]; finished: ScheduleItem[] } {
  const upcoming = items.filter((i) => i.status === "upcoming" && sameLocalDayIso(i.startAt, day));
  const finished = items.filter((i) => {
    if (i.status !== "finished") return false;
    const anchorIso = i.endAt || i.startAt;
    return sameLocalDayIso(anchorIso, day);
  });
  return { upcoming, finished };
}
