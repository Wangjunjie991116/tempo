import { useCallback, useEffect, useState } from "react";

import { createScheduleRepository } from "../repo/ScheduleRepository";
import type { ScheduleItem } from "../repo/types";

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

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
