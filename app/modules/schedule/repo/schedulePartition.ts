import type { ScheduleItem } from "./types";

function sameLocalDay(iso: string, anchor: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === anchor.getFullYear() &&
    d.getMonth() === anchor.getMonth() &&
    d.getDate() === anchor.getDate()
  );
}

/** Finished 归属：优先 endAt 所在本地日；若无 endAt 则用 startAt（与平台规格一致）。 */
export function partitionScheduleForDay(
  items: ScheduleItem[],
  day: Date,
): { upcoming: ScheduleItem[]; finished: ScheduleItem[] } {
  const upcoming = items.filter((i) => i.status === "upcoming" && sameLocalDay(i.startAt, day));
  const finished = items.filter((i) => {
    if (i.status !== "finished") return false;
    const anchorIso = i.endAt || i.startAt;
    return sameLocalDay(anchorIso, day);
  });
  return { upcoming, finished };
}
