import { useCallback, useEffect, useState } from "react";

import { createScheduleRepository } from "../repo/ScheduleRepository";
import { subscribeScheduleChanges } from "../repo/scheduleStorage";
import type { ScheduleItem } from "../repo/types";

/**
 * 加载并持有全量日程（适合横向按日分页：内存分区，避免每页两次 IO）。
 * 当本地日程数据被 AI 助手或其它模块修改时自动刷新。
 *
 * @returns `{ items, loading, refresh }` — `refresh()` 可手动触发重新 `getAll()`
 *
 * @example
 * ```tsx
 * const { items, loading, refresh } = useScheduleAllItems();
 * // 各日页面内：partitionScheduleForDay(items, day)
 * ```
 */
export function useScheduleAllItems() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const repo = createScheduleRepository();
    setLoading(true);
    try {
      const all = await repo.getAll();
      setItems(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeScheduleChanges(() => {
      void refresh();
    });
  }, [refresh]);

  return { items, loading, refresh };
}
