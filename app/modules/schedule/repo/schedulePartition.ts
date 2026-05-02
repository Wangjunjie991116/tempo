import type { ScheduleItem } from "./types";

/**
 * 判断毫秒时刻所在 **本地日历日** 是否与锚定日 `anchor` 同一天。
 *
 * @param epochMs Unix 毫秒
 * @param anchor 页面选中的「日历日」（通常为当日 0 点的 Date）
 *
 * @example
 * ```ts
 * const anchor = new Date(2026, 4, 2);
 * sameLocalDayMs(Date.parse("2026-05-02T09:00:00.000Z"), anchor);
 * ```
 */
function sameLocalDayMs(epochMs: number, anchor: Date): boolean {
  const d = new Date(epochMs);
  return (
    d.getFullYear() === anchor.getFullYear() &&
    d.getMonth() === anchor.getMonth() &&
    d.getDate() === anchor.getDate()
  );
}

/**
 * 已完成条目分区锚点：`endAt > 0` 用 `endAt`，否则回退 `startAt`（与卡片展示一致）。
 *
 * @example
 * ```ts
 * finishedAnchorMs({ endAt: 0, startAt: 100, ... } as ScheduleItem); // => 100
 * finishedAnchorMs({ endAt: 200, startAt: 100, ... } as ScheduleItem); // => 200
 * ```
 */
function finishedAnchorMs(item: ScheduleItem): number {
  return item.endAt > 0 ? item.endAt : item.startAt;
}

/**
 * 将全量日程列表按「某一天」拆成 **未完成 / 已完成** 两段（均为本地日历语义）。
 *
 * - **upcoming**：`status === "upcoming"` 且 `startAt` 落在 `day` 当天。
 * - **finished**：`status === "finished"`，归属日以 **`endAt`（>0）优先**，否则 `startAt`。
 *
 * @param items 仓储返回的全量数组（或内存中的副本）
 * @param day 当前分页 / 日期条选中的本地日
 *
 * @example
 * ```ts
 * const day = new Date(2026, 4, 2); // 2026-05-02 本地
 * partitionScheduleForDay(allItems, day);
 * ```
 */
export function partitionScheduleForDay(
  items: ScheduleItem[],
  day: Date,
): { upcoming: ScheduleItem[]; finished: ScheduleItem[] } {
  const upcoming = items.filter((i) => i.status === "upcoming" && sameLocalDayMs(i.startAt, day));
  const finished = items.filter((i) => {
    if (i.status !== "finished") return false;
    return sameLocalDayMs(finishedAnchorMs(i), day);
  });
  return { upcoming, finished };
}
