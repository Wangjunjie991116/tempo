/** 日程卡片标签类型（与设计 / Figma 对齐）。 */
export type ScheduleTag = "design_review" | "workshop" | "brainstorm";

/**
 * 单条日程持久化模型（AsyncStorage JSON 数组元素）。
 *
 * - **`startAt` / `endAt`**：ISO 8601 字符串；展示与「自然日」分区时使用 **设备本地时区** 解析。
 * - **`status`**：`upcoming` 列表只展示未完成；`finished` 展示已完成（分区规则见 `schedulePartition`）。
 */
export interface ScheduleItem {
  id: string;
  title: string;
  tag: ScheduleTag;
  /** 开始时间，ISO 8601（例：`2026-05-02T09:00:00.000Z`） */
  startAt: string;
  /** 结束时间；已完成条目分区时优先按该字段所在本地日归档 */
  endAt: string;
  status: "upcoming" | "finished";
  attendeeCount: number;
  attendeeOverflow?: number;
}
