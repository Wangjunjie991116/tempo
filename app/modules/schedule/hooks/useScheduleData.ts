import { useCallback, useEffect, useState } from "react";

import { createScheduleRepository } from "../repo/ScheduleRepository";
import type { ScheduleItem } from "../repo/types";
import { startOfLocalDay } from "../utils/calendarRange";

/**
 * 按 **选中本地日** 拉取该日的 upcoming / finished（每次 `selectedDay` 变化或 `refresh` 会重新请求仓储）。
 *
 * @param selectedDay 日期条或外部状态传入的「当前选中曰」（任意时刻会被规范到当日 0 点参与缓存键）
 *
 * @returns `{ upcoming, finished, loading, refresh }`
 *
 * @example
 * ```tsx
 * const [day, setDay] = useState(() => startOfLocalDay(new Date()));
 * const { upcoming, finished, loading, refresh } = useScheduleData(day);
 * ```
 */
export function useScheduleData(selectedDay: Date) {
  const [upcoming, setUpcoming] = useState<ScheduleItem[]>([]);
  const [finished, setFinished] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const dayMs = startOfLocalDay(selectedDay).getTime();

  const refresh = useCallback(async () => {
    const repo = createScheduleRepository();
    const day = new Date(dayMs);
    setLoading(true);
    try {
      const { upcoming: u, finished: f } = await repo.listScheduleForDay(day);
      setUpcoming(u);
      setFinished(f);
    } finally {
      setLoading(false);
    }
  }, [dayMs]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { upcoming, finished, loading, refresh };
}
