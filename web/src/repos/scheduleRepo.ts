import type { ScheduleDraft } from "../types/api";

/** `localStorage` 键：Web 端草稿列表（与 RN 壳 AsyncStorage 日程库分离）。 */
const KEY = "tempo.schedules.v1";

/** 持久化行：在 {@link ScheduleDraft} 上增加客户端生成的 id 与时间戳。 */
export interface StoredSchedule extends ScheduleDraft {
  id: string;
  createdAt: string;
}

/**
 * 读出当前键下全部草稿；JSON 非法或非数组时返回空数组。
 *
 * @example
 * ```ts
 * readAll(); // => [] 或 StoredSchedule[]
 * ```
 */
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

/**
 * 覆盖写入整条草稿列表。
 *
 * @example
 * ```ts
 * writeAll([]); // 清空
 * ```
 */
function writeAll(items: StoredSchedule[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

/**
 * 将解析得到的 {@link ScheduleDraft} **落到本地**：生成 `id`、`createdAt` 并插到列表头部。
 *
 * @returns 带 `id` / `createdAt` 的可持久化行（便于立刻渲染或回显）
 *
 * @example
 * ```ts
 * const row = saveDraft({
 *   title: "Stand-up",
 *   start_at: "2026-05-02T09:00:00Z",
 *   end_at: null,
 *   all_day: false,
 *   confidence: 0.9,
 *   notes: null,
 * });
 * row.id; // UUID
 * ```
 */
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

/**
 * 返回本地存储中的草稿列表（最新在前，与 {@link saveDraft} 插入顺序一致）。
 *
 * @example
 * ```ts
 * listSchedules().length;
 * ```
 */
export function listSchedules(): StoredSchedule[] {
  return readAll();
}
