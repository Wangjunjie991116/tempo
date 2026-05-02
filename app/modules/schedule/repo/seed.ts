import type { ScheduleItem } from "./types";

function iso(d: Date): string {
  return d.toISOString();
}

/** Demo seed aligned to the user's local calendar day so Task 7 UI shows data on fresh install. */
export function buildScheduleSeed(): ScheduleItem[] {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const start1 = new Date(base);
  start1.setHours(9, 0, 0, 0);
  const end1 = new Date(base);
  end1.setHours(9, 45, 0, 0);

  const yesterday = new Date(base);
  yesterday.setDate(yesterday.getDate() - 1);
  const start2 = new Date(yesterday);
  start2.setHours(14, 0, 0, 0);
  const end2 = new Date(yesterday);
  end2.setHours(15, 30, 0, 0);

  return [
    {
      id: "1",
      title: "Project Design Discussion",
      tag: "design_review",
      startAt: iso(start1),
      endAt: iso(end1),
      status: "upcoming",
      attendeeCount: 3,
      attendeeOverflow: 6,
    },
    {
      id: "2",
      title: "Leadership Training 101",
      tag: "workshop",
      startAt: iso(start2),
      endAt: iso(end2),
      status: "finished",
      attendeeCount: 3,
      attendeeOverflow: 6,
    },
  ];
}

export const SCHEDULE_SEED_EN: ScheduleItem[] = buildScheduleSeed();
