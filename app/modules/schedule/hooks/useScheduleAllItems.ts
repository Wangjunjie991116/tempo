import { useCallback, useEffect, useState } from "react";

import { createScheduleRepository } from "../repo/ScheduleRepository";
import type { ScheduleItem } from "../repo/types";

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

  return { items, loading, refresh };
}
