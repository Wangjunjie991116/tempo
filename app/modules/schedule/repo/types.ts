/** 日程卡片标签类型（与设计 / Figma 对齐）。 */
export type ScheduleTag = "design_review" | "workshop" | "brainstorm";

/**
 * 单条日程持久化模型（AsyncStorage JSON 数组元素 / 未来数据库行）。
 *
 * - **`startAt` / `endAt`**：**Unix 毫秒时间戳**（`number`），为唯一真源；UI 用 `new Date(ms)` 或统一格式化函数呈现。
 * - **`endAt`**：非正或缺失（读库兼容）时，已完成分区与展示回退逻辑按 `startAt` 处理。
 * - **`status`**：`upcoming` / `finished`，分区见 `schedulePartition`。
 */
export interface ScheduleItem {
  id: string;
  title: string;
  tag: ScheduleTag;
  /** 开始时刻，Unix 毫秒 */
  startAt: number;
  /** 结束时刻，Unix 毫秒；`0` 表示未设置（已完成归档时用 `startAt`） */
  endAt: number;
  status: "upcoming" | "finished";
  attendeeCount: number;
  attendeeOverflow?: number;
}
