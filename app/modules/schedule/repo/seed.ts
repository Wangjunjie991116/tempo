import type { ScheduleItem } from "./types";

/**
 * 内置演示日程（写死在代码里）。时间为 **UTC** 的 **2026-05-02** 当日区间。
 *
 * 列表按 **设备本地日历日** 分区（`partitionScheduleForDay`）：在绝大多数时区都会落在本地 5 月 2 日；
 * 极西侧（约 UTC−11 及以西）或极东侧（约 UTC+14）仍可能出现「UTC 的 5 月 2 日」对应本地 **5 月 1 日或 5 月 3 日」，此时请在日期条点到本地对应的那一天查看。
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
