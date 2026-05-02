import type { ScheduleItem } from "./types";

export const SCHEDULE_SEED_EN: ScheduleItem[] = [
  {
    id: "1",
    title: "Project Design Discussion",
    tag: "design_review",
    startAt: "2024-12-03T09:00:00.000Z",
    endAt: "2024-12-03T09:45:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
    attendeeOverflow: 6,
  },
  {
    id: "2",
    title: "Leadership Training 101",
    tag: "workshop",
    startAt: "2024-12-03T10:00:00.000Z",
    endAt: "2024-12-03T11:30:00.000Z",
    status: "finished",
    attendeeCount: 3,
    attendeeOverflow: 6,
  },
];
