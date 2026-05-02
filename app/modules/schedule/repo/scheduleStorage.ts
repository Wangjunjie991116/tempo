import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_SCHEDULE_ITEMS } from "./seed";
import type { ScheduleItem } from "./types";

/** 唯一持久化键（不再按版本维护多套 key）。 */
export const SCHEDULE_STORAGE_KEY = "tempo.schedule";

/** 旧键名：启动覆盖写入时顺带删除，避免残留。 */
const LEGACY_SCHEDULE_STORAGE_KEY_V3 = "tempo.schedule.v3";

function cloneDefaultItems(): ScheduleItem[] {
  return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_ITEMS)) as ScheduleItem[];
}

function parseStoredItems(raw: string | null): ScheduleItem[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ScheduleItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * 是否已完成「本轮 JS 进程」的首次加载。
 * 每次 App 冷启动后第一次 `loadScheduleItems`：无视库里已有内容，写入 **`DEFAULT_SCHEDULE_ITEMS`** 克隆；
 * 同一会话内后续调用则正常读库（本会话内若有 `saveScheduleItems` 仍可持久化并被读到）。
 */
let startupOverwriteApplied = false;

/**
 * 并发多次 `loadScheduleItems()`（例如 Strict Mode 双挂载）共用同一 Promise，避免交叉读写。
 */
let loadInflight: Promise<ScheduleItem[]> | null = null;

async function loadScheduleItemsInternal(): Promise<ScheduleItem[]> {
  if (!startupOverwriteApplied) {
    startupOverwriteApplied = true;
    const initial = cloneDefaultItems();
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(initial));
    await AsyncStorage.removeItem(LEGACY_SCHEDULE_STORAGE_KEY_V3);
    return initial;
  }

  const raw = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
  let parsed = parseStoredItems(raw);
  if (parsed.length === 0) {
    const initial = cloneDefaultItems();
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return parsed;
}

/**
 * 读取本地日程：进程内首次调用会先覆盖写入内置默认数据；之后读取当前键值。
 */
export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  if (!loadInflight) {
    loadInflight = loadScheduleItemsInternal().finally(() => {
      loadInflight = null;
    });
  }
  return loadInflight;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
