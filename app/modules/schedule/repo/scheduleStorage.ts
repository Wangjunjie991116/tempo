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
export const DEV_SCHEDULE_BOOTSTRAP_VERSION = "2026-05-02-expo-go-bootstrap";

/** Release 不注入 Mock；开发期见 `docs/superpowers/specs/2026-05-02-schedule-platform-design.md` §7 */
export function shouldMergeScheduleDevSeed(): boolean {
  if (__DEV__) return true;
  return process.env.EXPO_PUBLIC_SCHEDULE_DEV_SEED === "1";
}

/**
 * 仅在 __DEV__：把含 `tempo.schedule` 的键及摘要打到 Metro 终端（Expo Go 同理）。
 * 打开日程页触发 `loadScheduleItems` 后即可在运行 `expo start` 的终端里搜索 `[Tempo][schedule-storage]`。
 */
export async function debugDumpScheduleStorage(reason: string): Promise<void> {
  if (!__DEV__) return;
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tempoKeys = allKeys.filter((k) => k.includes("tempo.schedule")).sort();
    const pairs: [string, string | null][] = [];
    for (const k of tempoKeys) {
      pairs.push([k, await AsyncStorage.getItem(k)]);
    }
    const marker = await AsyncStorage.getItem(DEV_BOOTSTRAP_MARKER_KEY);
    console.log(
      `[Tempo][schedule-storage] ${reason} __DEV__=${String(__DEV__)} mergeSeed=${String(shouldMergeScheduleDevSeed())} bootstrapMarker=${marker ?? "(null)"}`,
    );
    console.log(`[Tempo][schedule-storage] matching keys (${tempoKeys.length}): ${tempoKeys.join(", ") || "(none)"}`);
    for (const [k, v] of pairs) {
      if (v == null) {
        console.log(`[Tempo][schedule-storage] ${k} => (null)`);
        continue;
      }
      try {
        const parsed: unknown = JSON.parse(v);
        const summary =
          Array.isArray(parsed) ? `array length=${parsed.length}` : `type=${typeof parsed}`;
        console.log(`[Tempo][schedule-storage] ${k} => ${summary}; rawChars=${v.length}`);
      } catch {
        console.log(`[Tempo][schedule-storage] ${k} => invalid JSON, preview=${v.slice(0, 80)}`);
      }
    }
  } catch (e) {
    console.warn("[Tempo][schedule-storage] debugDump failed", e);
  }
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

  let result: ScheduleItem[];
  if (!shouldMergeScheduleDevSeed()) {
    result = parsed;
  } else {
    const merged = mergeDevSeedIntoParsed(parsed);
    if (JSON.stringify(merged) !== JSON.stringify(parsed)) {
      await saveScheduleItems(merged);
    }
    result = merged;
  }

  if (__DEV__) void debugDumpScheduleStorage(`after loadScheduleItems (return ${result.length} items)`);
  return result;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
