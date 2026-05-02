import type { ScheduleItem } from "./types";

/**
 * 内置演示日程（写死在代码里）。时间锚定 **2026-05-02**（ISO 8601 UTC）。
 * 列表页按「选中日」过滤：若设备当天不是该日，请在日期条滑到 2026-05-02 查看全部 6 条。
 */
export const DEFAULT_SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: "1",
    title: "Project Design Discussion",
    tag: "design_review",
    startAt: "2026-05-02T09:00:00.000Z",
    endAt: "2026-05-02T09:45:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
    attendeeOverflow: 6,
  },
  {
    id: "2",
    title: "Leadership Training 101",
    tag: "workshop",
    startAt: "2026-05-02T10:30:00.000Z",
    endAt: "2026-05-02T11:30:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
  },
  {
    id: "3",
    title: "Team Brainstorm — Q3",
    tag: "brainstorm",
    startAt: "2026-05-02T14:00:00.000Z",
    endAt: "2026-05-02T15:30:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
  },
  {
    id: "4",
    title: "Design Review — Navigation",
    tag: "design_review",
    startAt: "2026-05-02T16:15:00.000Z",
    endAt: "2026-05-02T17:00:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
  },
  {
    id: "5",
    title: "Morning stand-up",
    tag: "workshop",
    startAt: "2026-05-02T08:30:00.000Z",
    endAt: "2026-05-02T09:15:00.000Z",
    status: "finished",
    attendeeCount: 5,
  },
  {
    id: "6",
    title: "Client sync call",
    tag: "design_review",
    startAt: "2026-05-02T11:00:00.000Z",
    endAt: "2026-05-02T11:45:00.000Z",
    status: "finished",
    attendeeCount: 2,
    attendeeOverflow: 4,
  },
];
