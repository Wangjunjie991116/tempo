/**
 * 日程卡片副标题：时间段展示（**本地时区**）。不含星期。
 *
 * - 同日：`2026/5/2 12:15 - 16:13`
 * - 跨日：`2026/5/2 12:15 - 2026/5/4 16:13`
 */

/** 本地日历日的日期段：`YYYY/M/D`（月、日不补零）。 */
function localYmdSlash(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 本地时刻的 `HH:mm`（时、分两位补零）。 */
function localHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 同一本地自然日判断用的粗粒度键（年月日拼接，非 ISO）。 */
function localCalendarKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

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
  const start = new Date(startMs);
  const end = Number.isFinite(endMs) && endMs > 0 ? new Date(endMs) : start;

  const datePart = localYmdSlash(start);
  const t0 = localHm(start);
  const t1 = localHm(end);

  if (localCalendarKey(start) === localCalendarKey(end)) {
    return `${datePart} ${t0} - ${t1}`;
  }

  return `${datePart} ${t0} - ${localYmdSlash(end)} ${t1}`;
}
