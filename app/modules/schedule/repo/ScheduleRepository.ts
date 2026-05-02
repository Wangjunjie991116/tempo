import { partitionScheduleForDay } from "./schedulePartition";
import { loadScheduleItems } from "./scheduleStorage";
import type { ScheduleItem } from "./types";

/**
 * 读取 **全量** 日程后，按某一天拆分 upcoming / finished。
 *
 * @param day 本地日历日（通常为当日 0 点）
 *
 * @example
 * ```ts
 * const { upcoming, finished } = await listScheduleForDay(new Date(2026, 4, 2));
 * ```
 */
async function listScheduleForDay(day: Date): Promise<{
  upcoming: ScheduleItem[];
  finished: ScheduleItem[];
}> {
  const all = await loadScheduleItems();
  return partitionScheduleForDay(all, day);
}

/**
 * 创建日程仓储实例（无全局单例，按需 `createScheduleRepository()` 即可）。
 *
 * - **`getAll`**：等价于一次 `loadScheduleItems()`（含首次覆盖写入默认数据语义）。
 * - **`listScheduleForDay`**：全量 + `partitionScheduleForDay`，避免按日重复读库时再手写过滤。
 * - **`listByDay` / `listFinishedByDay`**：兼容旧调用方，内部分别取分区结果的某一桶。
 *
 * @example
 * ```ts
 * const repo = createScheduleRepository();
 * const all = await repo.getAll();
 * const { upcoming, finished } = await repo.listScheduleForDay(new Date());
 * ```
 */
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

/** `createScheduleRepository()` 的返回类型别名，便于注入与 Mock。 */
export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
