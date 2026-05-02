import { partitionScheduleForDay } from "./schedulePartition";
import { loadScheduleItems } from "./scheduleStorage";
import type { ScheduleItem } from "./types";

async function listScheduleForDay(day: Date): Promise<{
  upcoming: ScheduleItem[];
  finished: ScheduleItem[];
}> {
  const all = await loadScheduleItems();
  return partitionScheduleForDay(all, day);
}

export function createScheduleRepository() {
  return {
    async getAll(): Promise<ScheduleItem[]> {
      return loadScheduleItems();
    },
    async listScheduleForDay(day: Date) {
      return listScheduleForDay(day);
    },
    async listByDay(day: Date): Promise<ScheduleItem[]> {
      const { upcoming } = await listScheduleForDay(day);
      return upcoming;
    },
    async listFinishedByDay(day: Date): Promise<ScheduleItem[]> {
      const { finished } = await listScheduleForDay(day);
      return finished;
    },
  };
}

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
