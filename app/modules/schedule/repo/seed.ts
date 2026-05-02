import type { ScheduleItem } from "./types";

function iso(d: Date): string {
  return d.toISOString();
}

/** 锚定「今天」本地日历日：4 upcoming + 2 finished（均为当日可见数据）。 */
export function buildScheduleSeed(): ScheduleItem[] {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  function atToday(h: number, m: number): Date {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  }

  const upcomingSpecs: { title: string; tag: ScheduleItem["tag"]; start: [number, number]; durMin: number }[] = [
    { title: "Project Design Discussion", tag: "design_review", start: [9, 0], durMin: 45 },
    { title: "Leadership Training 101", tag: "workshop", start: [10, 30], durMin: 60 },
    { title: "Team Brainstorm — Q3", tag: "brainstorm", start: [14, 0], durMin: 90 },
    { title: "Design Review — Navigation", tag: "design_review", start: [16, 15], durMin: 45 },
  ];

  const upcoming: ScheduleItem[] = upcomingSpecs.map((s, i) => {
    const start = atToday(s.start[0], s.start[1]);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + s.durMin);
    return {
      id: `seed-u-${i + 1}`,
      title: s.title,
      tag: s.tag,
      startAt: iso(start),
      endAt: iso(end),
      status: "upcoming" as const,
      attendeeCount: 3,
      attendeeOverflow: i === 0 ? 6 : undefined,
    };
  });

  const f1Start = atToday(8, 30);
  const f1End = atToday(9, 15);
  const f2Start = atToday(11, 0);
  const f2End = atToday(11, 45);

  const finished: ScheduleItem[] = [
    {
      id: "seed-f-1",
      title: "Morning stand-up",
      tag: "workshop",
      startAt: iso(f1Start),
      endAt: iso(f1End),
      status: "finished",
      attendeeCount: 5,
    },
    {
      id: "seed-f-2",
      title: "Client sync call",
      tag: "design_review",
      startAt: iso(f2Start),
      endAt: iso(f2End),
      status: "finished",
      attendeeCount: 2,
      attendeeOverflow: 4,
    },
  ];

  return [...upcoming, ...finished];
}

export const SCHEDULE_SEED_EN: ScheduleItem[] = buildScheduleSeed();
