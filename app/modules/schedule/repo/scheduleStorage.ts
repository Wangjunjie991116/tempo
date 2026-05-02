import AsyncStorage from "@react-native-async-storage/async-storage";

import { buildScheduleSeed } from "./seed";
import type { ScheduleItem } from "./types";

/**
 * 当前日程数组所在桶。升级时可把旧 key 加入 LEGACY_SCHEDULE_STORAGE_KEYS 并在 DEV_SCHEDULE_BOOTSTRAP_VERSION 换代。
 */
export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v3";

/** 开发 bootstrap 时会全部移除，避免读到历史幽灵桶 */
export const LEGACY_SCHEDULE_STORAGE_KEYS = [
  "tempo.schedule.v1",
  "tempo.schedule.v2",
  "tempo.schedule.v3",
] as const;

const DEV_BOOTSTRAP_MARKER_KEY = "tempo.schedule.devBootstrapVersion";

/** 需要强制清空本地日程时：增大该字符串（任意），下次 __DEV__ 冷启动会删桶并重灌 Mock */
export const DEV_SCHEDULE_BOOTSTRAP_VERSION = "2026-05-02-seed-reset-v2";

/** Release 不注入 Mock；开发期见 `docs/superpowers/specs/2026-05-02-schedule-platform-design.md` §7 */
export function shouldMergeScheduleDevSeed(): boolean {
  if (__DEV__) return true;
  return process.env.EXPO_PUBLIC_SCHEDULE_DEV_SEED === "1";
}

export function mergeWithSeedIfEmpty(existing: ScheduleItem[], seed: ScheduleItem[]): ScheduleItem[] {
  if (existing.length > 0) return existing;
  return seed;
}

async function ensureDevScheduleBootstrap(): Promise<void> {
  if (!__DEV__) return;
  const marker = await AsyncStorage.getItem(DEV_BOOTSTRAP_MARKER_KEY);
  if (marker === DEV_SCHEDULE_BOOTSTRAP_VERSION) return;
  await Promise.all([...LEGACY_SCHEDULE_STORAGE_KEYS].map((k) => AsyncStorage.removeItem(k)));
  await AsyncStorage.setItem(DEV_BOOTSTRAP_MARKER_KEY, DEV_SCHEDULE_BOOTSTRAP_VERSION);
}

/** 开发期注入用：去掉旧版 seed，再挂上当日 buildScheduleSeed() */
function mergeDevSeedIntoParsed(parsed: ScheduleItem[]): ScheduleItem[] {
  const seed = buildScheduleSeed();
  const nonSeed = parsed.filter((i) => !String(i.id).startsWith("seed-"));
  return [...nonSeed, ...seed];
}

export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  await ensureDevScheduleBootstrap();

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
