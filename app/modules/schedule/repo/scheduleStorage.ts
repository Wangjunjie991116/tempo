import AsyncStorage from "@react-native-async-storage/async-storage";

import { SCHEDULE_SEED_EN } from "./seed";
import type { ScheduleItem } from "./types";

export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v1";

export function mergeWithSeedIfEmpty(existing: ScheduleItem[], seed: ScheduleItem[]): ScheduleItem[] {
  if (existing.length > 0) return existing;
  return seed;
}

export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  const raw = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
  let parsed: ScheduleItem[] = [];
  if (raw) {
    try {
      parsed = JSON.parse(raw) as ScheduleItem[];
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      parsed = [];
    }
  }
  const merged = mergeWithSeedIfEmpty(parsed, SCHEDULE_SEED_EN);
  if (parsed.length === 0 && merged.length > 0) {
    await saveScheduleItems(merged);
  }
  return merged;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
