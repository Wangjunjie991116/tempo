import AsyncStorage from "@react-native-async-storage/async-storage";

import { buildScheduleSeed } from "./seed";
import type { ScheduleItem } from "./types";

/** Bump when seed shape / dev mock policy changes so本地空库可重新合并 seed */
export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v2";

/** Release 不注入 Mock；开发期见 `docs/superpowers/specs/2026-05-02-schedule-platform-design.md` §7 */
export function shouldMergeScheduleDevSeed(): boolean {
  if (__DEV__) return true;
  return process.env.EXPO_PUBLIC_SCHEDULE_DEV_SEED === "1";
}

export function mergeWithSeedIfEmpty(existing: ScheduleItem[], seed: ScheduleItem[]): ScheduleItem[] {
  if (existing.length > 0) return existing;
  return seed;
}

/** 开发期注入用：去掉旧版 seed，再挂上当日 buildScheduleSeed()，避免「库里有脏数据 → 永远不合并新 seed」导致列表空 */
function mergeDevSeedIntoParsed(parsed: ScheduleItem[]): ScheduleItem[] {
  const seed = buildScheduleSeed();
  const nonSeed = parsed.filter((i) => !String(i.id).startsWith("seed-"));
  return [...nonSeed, ...seed];
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

  if (!shouldMergeScheduleDevSeed()) {
    return parsed;
  }

  const merged = mergeDevSeedIntoParsed(parsed);
  if (JSON.stringify(merged) !== JSON.stringify(parsed)) {
    await saveScheduleItems(merged);
  }
  return merged;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
