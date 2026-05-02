import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_SCHEDULE_ITEMS } from "./seed";
import type { ScheduleItem } from "./types";

export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v3";

function cloneDefaultItems(): ScheduleItem[] {
  return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_ITEMS)) as ScheduleItem[];
}

/**
 * 读取本地日程数组。若从未写入或为空，则用内置默认 JSON 写入 AsyncStorage 后再返回。
 */
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

  if (parsed.length === 0) {
    const initial = cloneDefaultItems();
    await saveScheduleItems(initial);
    return initial;
  }

  return parsed;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
