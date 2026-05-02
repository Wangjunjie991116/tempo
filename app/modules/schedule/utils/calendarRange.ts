/**
 * 日程横向日历条与按日分页共用的本地日历工具（均为 **设备本地时区** 下的年月日语义）。
 */

/**
 * 将任意时刻截断到「当天本地 0 点」，用于同一日历日的比较与索引。
 *
 * @param d 任意 Date（含时分秒）
 * @returns 新的 Date 实例，时间为当日本地 00:00:00.000
 *
 * @example
 * ```ts
 * const x = new Date(2026, 4, 2, 15, 30); // 2026-05-02 15:30 本地
 * startOfLocalDay(x); // => Date 表示 2026-05-02 00:00 本地
 * ```
 */
export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * 判断两个 Date 是否落在 **同一本地日历日**（忽略时分秒）。
 *
 * @example
 * ```ts
 * sameLocalDay(new Date(2026, 4, 2, 8), new Date(2026, 4, 2, 22)); // => true
 * sameLocalDay(new Date(2026, 4, 2), new Date(2026, 4, 3)); // => false
 * ```
 */
export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 日历条可滚动区间的边界：**前年 1 月 1 日**～**次年 12 月 31 日**（本地），公历年取当前设备的年份。
 *
 * @example 若当前为 2026 年，则 min≈2025-01-01，max≈2027-12-31（均为本地 0 点）
 */
export function stripCalendarBounds(): { min: Date; max: Date } {
  const y = new Date().getFullYear();
  return {
    min: startOfLocalDay(new Date(y - 1, 0, 1)),
    max: startOfLocalDay(new Date(y + 1, 11, 31)),
  };
}

/**
 * 生成从 `min` 到 `max`（含首尾）每一个本地日历日对应的 Date（均为当日 0 点）。
 *
 * @example
 * ```ts
 * const min = new Date(2026, 4, 1);
 * const max = new Date(2026, 4, 3);
 * enumerateDaysInclusive(min, max).map(localDayKey);
 * // => ["2026-05-01", "2026-05-02", "2026-05-03"]
 * ```
 */
export function enumerateDaysInclusive(min: Date, max: Date): Date[] {
  const out: Date[] = [];
  let cur = startOfLocalDay(min);
  const endT = startOfLocalDay(max).getTime();
  while (cur.getTime() <= endT) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * 将本地日历日折叠为稳定字符串键，用于 `FlatList`/`keyExtractor` 等。
 *
 * @example
 * ```ts
 * localDayKey(new Date(2026, 4, 2)); // => "2026-05-02"
 * ```
 */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 在已排序的「日序列」中查找与 `day` 同一天的下标；找不到返回 `-1`。
 *
 * @example
 * ```ts
 * const days = enumerateDaysInclusive(min, max);
 * indexOfSameDay(days, new Date(2026, 4, 2)); // 对应 2026-05-02 在数组中的索引
 * ```
 */
export function indexOfSameDay(days: Date[], day: Date): number {
  const t = startOfLocalDay(day).getTime();
  return days.findIndex((d) => startOfLocalDay(d).getTime() === t);
}
