import { loadScheduleItems } from "./scheduleStorage";
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
function finishedOnLocalDay(item: ScheduleItem, day: Date): boolean {
  if (item.status !== "finished") return false;
  const anchorIso = item.endAt || item.startAt;
  return sameLocalDay(anchorIso, day);
}

export function createScheduleRepository() {
  return {
    async getAll(): Promise<ScheduleItem[]> {
      return loadScheduleItems();
    },
    async listByDay(day: Date): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => i.status === "upcoming" && sameLocalDay(i.startAt, day));
    },
    async listFinishedByDay(day: Date): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => finishedOnLocalDay(i, day));
    },
  };
}

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
