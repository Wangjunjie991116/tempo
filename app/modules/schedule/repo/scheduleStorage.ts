import AsyncStorage from "@react-native-async-storage/async-storage";

import { SCHEDULE_SEED_EN } from "./seed";
import type { ScheduleItem } from "./types";

export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v1";

/** Release 不注入 Mock；开发期见 `docs/superpowers/specs/2026-05-02-schedule-platform-design.md` §7 */
export function shouldMergeScheduleDevSeed(): boolean {
  if (__DEV__) return true;
  return process.env.EXPO_PUBLIC_SCHEDULE_DEV_SEED === "1";
}

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
  const seed = shouldMergeScheduleDevSeed() ? SCHEDULE_SEED_EN : [];
  const merged = mergeWithSeedIfEmpty(parsed, seed);
  if (parsed.length === 0 && merged.length > 0) {
    await saveScheduleItems(merged);
  }
  return merged;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
