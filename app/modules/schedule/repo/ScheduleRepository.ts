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

export function createScheduleRepository() {
  return {
    async getAll(): Promise<ScheduleItem[]> {
      return loadScheduleItems();
    },
    async listByDay(day: Date): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => i.status === "upcoming" && sameLocalDay(i.startAt, day));
    },
    async listFinished(): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => i.status === "finished");
    },
  };
}

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
