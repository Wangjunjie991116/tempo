export type ScheduleCardTimeSegmentRole = "date" | "time" | "sep";

export type ScheduleCardTimeSegment = {
  role: ScheduleCardTimeSegmentRole;
  text: string;
};

function localYmdSlash(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function localHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function localCalendarKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * 将卡片时段拆成可按角色上色的片段（日期 vs 24h 时间），与 {@link formatScheduleCardTimeRange} 语义一致。
 *
 * @example
 * ```ts
 * getScheduleCardTimeSegments(
 *   new Date(2026, 4, 2, 12, 15).getTime(),
 *   new Date(2026, 4, 2, 16, 13).getTime(),
 * );
 * ```
 */
export function getScheduleCardTimeSegments(startMs: number, endMs: number): ScheduleCardTimeSegment[] {
  const start = new Date(startMs);
  const end = Number.isFinite(endMs) && endMs > 0 ? new Date(endMs) : start;

  const datePart = localYmdSlash(start);
  const t0 = localHm(start);
  const t1 = localHm(end);

  if (localCalendarKey(start) === localCalendarKey(end)) {
    return [
      { role: "date", text: datePart },
      { role: "sep", text: " " },
      { role: "time", text: `${t0} - ${t1}` },
    ];
  }

  return [
    { role: "date", text: datePart },
    { role: "sep", text: " " },
    { role: "time", text: t0 },
    { role: "sep", text: " - " },
    { role: "date", text: localYmdSlash(end) },
    { role: "sep", text: " " },
    { role: "time", text: t1 },
  ];
}
