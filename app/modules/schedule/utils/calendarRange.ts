/** 本地日历日的 00:00:00.000 */
export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Jan 1 (year−1) … Dec 31 (year+1)，year = 设备当前公历年 */
export function stripCalendarBounds(): { min: Date; max: Date } {
  const y = new Date().getFullYear();
  return {
    min: startOfLocalDay(new Date(y - 1, 0, 1)),
    max: startOfLocalDay(new Date(y + 1, 11, 31)),
  };
}

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

export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function indexOfSameDay(days: Date[], day: Date): number {
  const t = startOfLocalDay(day).getTime();
  return days.findIndex((d) => startOfLocalDay(d).getTime() === t);
}
