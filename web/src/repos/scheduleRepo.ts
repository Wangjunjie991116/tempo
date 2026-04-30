import type { ScheduleDraft } from "../types/api";

const KEY = "tempo.schedules.v1";

export interface StoredSchedule extends ScheduleDraft {
  id: string;
  createdAt: string;
}

function readAll(): StoredSchedule[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredSchedule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: StoredSchedule[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function saveDraft(draft: ScheduleDraft): StoredSchedule {
  const items = readAll();
  const row: StoredSchedule = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  items.unshift(row);
  writeAll(items);
  return row;
}

export function listSchedules(): StoredSchedule[] {
  return readAll();
}
