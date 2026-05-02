import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_SCHEDULE_ITEMS } from "./seed";
import type { ScheduleItem } from "./types";

/** 唯一持久化键（不再按版本维护多套 key）。 */
export const SCHEDULE_STORAGE_KEY = "tempo.schedule";

/** 旧键名：启动覆盖写入时顺带删除，避免残留。 */
const LEGACY_SCHEDULE_STORAGE_KEY_V3 = "tempo.schedule.v3";

const VALID_TAGS = new Set<ScheduleItem["tag"]>(["design_review", "workshop", "brainstorm"]);

/**
 * 读库时将 `number` 或 **旧版 ISO 字符串** 统一为毫秒戳。
 *
 * @param value `number`、非空 ISO 字符串或其它
 * @returns 合法毫秒；无法解析时为 `undefined`
 *
 * @example
 * ```ts
 * toEpochMs(1714641600000); // => 1714641600000
 * toEpochMs("2026-05-02T09:00:00.000Z"); // => 对应 UTC 时刻的毫秒
 * toEpochMs(""); // => undefined
 * ```
 */
function toEpochMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const n = Date.parse(value);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/**
 * 将 AsyncStorage JSON 中的单条未知对象 **归一**为 `ScheduleItem`；字段缺失或非法时返回 `null`。
 *
 * - `startAt`：须能通过 `toEpochMs` 得到毫秒。
 * - `endAt`：同上；若为空串 / `null` / `undefined` 则写 **`0`**（表示未设置）。
 *
 * @example
 * ```ts
 * coerceScheduleItem({
 *   id: "1",
 *   title: "x",
 *   tag: "brainstorm",
 *   startAt: "2026-05-02T09:00:00.000Z",
 *   endAt: "",
 *   status: "upcoming",
 *   attendeeCount: 1,
 * }); // => { ..., startAt: number, endAt: 0, ... }
 * ```
 */
function coerceScheduleItem(row: unknown): ScheduleItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = o.id;
  const title = o.title;
  const tag = o.tag;
  const status = o.status;
  if (typeof id !== "string" || typeof title !== "string" || typeof tag !== "string" || typeof status !== "string") {
    return null;
  }
  if (!VALID_TAGS.has(tag as ScheduleItem["tag"])) return null;
  if (status !== "upcoming" && status !== "finished") return null;

  const startAt = toEpochMs(o.startAt);
  if (startAt === undefined) return null;

  let endAt = toEpochMs(o.endAt);
  if (endAt === undefined) {
    if (o.endAt === "" || o.endAt === null || o.endAt === undefined) endAt = 0;
    else return null;
  }

  const attendeeCount = o.attendeeCount;
  if (typeof attendeeCount !== "number" || !Number.isFinite(attendeeCount)) return null;

  const attendeeOverflow = o.attendeeOverflow;
  const item: ScheduleItem = {
    id,
    title,
    tag: tag as ScheduleItem["tag"],
    startAt,
    endAt,
    status: status as ScheduleItem["status"],
    attendeeCount,
  };
  if (typeof attendeeOverflow === "number" && Number.isFinite(attendeeOverflow)) {
    item.attendeeOverflow = attendeeOverflow;
  }
  return item;
}

/**
 * 深拷贝内置默认 JSON，得到可安全 mutate 的 `ScheduleItem[]`（与常量引用脱钩）。
 *
 * @example
 * ```ts
 * const a = cloneDefaultItems();
 * const b = cloneDefaultItems();
 * a[0].title = "mutated";
 * // DEFAULT_SCHEDULE_ITEMS[0].title 不变；b[0].title 仍为原始演示文案
 * ```
 */
function cloneDefaultItems(): ScheduleItem[] {
  return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_ITEMS)) as ScheduleItem[];
}

/**
 * 将 AsyncStorage 读出的原始字符串 **安全解析** 为日程数组；非法项丢弃；非法输入整体视为「空数组」。
 *
 * @param raw `getItem` 返回值；`null`/空串/非数组 JSON 等均收敛为 `[]`
 *
 * @example
 * ```ts
 * parseStoredItems(null); // => []
 * parseStoredItems('[{"id":"1","title":"x","tag":"brainstorm","startAt":1714641600000,"endAt":1714642500000,"status":"upcoming","attendeeCount":1}]');
 * ```
 */
function parseStoredItems(raw: string | null): ScheduleItem[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceScheduleItem).filter((x): x is ScheduleItem => x !== null);
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

/**
 * `loadScheduleItems` 的内部实现：冷启动写入默认数据、读键、空库回退。
 */
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
 *
 * @returns 解析后的 `ScheduleItem[]`（首次必定为默认 6 条的克隆）
 *
 * @example
 * ```ts
 * const items = await loadScheduleItems(); // 冷启动首次：写入默认数据并返回
 * const again = await loadScheduleItems(); // 同进程：从 AsyncStorage 读出上次持久化结果
 * ```
 */
export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  if (!loadInflight) {
    loadInflight = loadScheduleItemsInternal().finally(() => {
      loadInflight = null;
    });
  }
  return loadInflight;
}

/**
 * 将整个日程数组序列化为 JSON 字符串写入 **`SCHEDULE_STORAGE_KEY`**。
 *
 * @example
 * ```ts
 * await saveScheduleItems(nextItems); // 覆盖写入 tempo.schedule
 * ```
 */
export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
