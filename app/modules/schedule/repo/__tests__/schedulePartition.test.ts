import { partitionScheduleForDay } from "../schedulePartition";
import type { ScheduleItem } from "../types";

function day(y: number, m0: number, d: number): Date {
  const x = new Date(y, m0, d);
  x.setHours(0, 0, 0, 0);
  return x;
}

describe("partitionScheduleForDay", () => {
  const anchor = day(2026, 4, 2);

  it("puts upcoming on startAt local day", () => {
    const items: ScheduleItem[] = [
      {
        id: "u1",
        title: "A",
        tag: "brainstorm",
        startAt: new Date(2026, 4, 2, 10, 0, 0).toISOString(),
        endAt: new Date(2026, 4, 2, 11, 0, 0).toISOString(),
        status: "upcoming",
        attendeeCount: 2,
      },
      {
        id: "u2",
        title: "B",
        tag: "brainstorm",
        startAt: new Date(2026, 4, 3, 10, 0, 0).toISOString(),
        endAt: new Date(2026, 4, 3, 11, 0, 0).toISOString(),
        status: "upcoming",
        attendeeCount: 1,
      },
    ];
    const { upcoming, finished } = partitionScheduleForDay(items, anchor);
    expect(upcoming.map((i) => i.id)).toEqual(["u1"]);
    expect(finished).toEqual([]);
  });

  it("finished uses endAt local day when present", () => {
    const items: ScheduleItem[] = [
      {
        id: "f1",
        title: "Done",
        tag: "workshop",
        startAt: new Date(2026, 4, 1, 22, 0, 0).toISOString(),
        endAt: new Date(2026, 4, 2, 9, 0, 0).toISOString(),
        status: "finished",
        attendeeCount: 3,
      },
    ];
    const { upcoming, finished } = partitionScheduleForDay(items, anchor);
    expect(upcoming).toEqual([]);
    expect(finished.map((i) => i.id)).toEqual(["f1"]);
  });

  it("finished falls back to startAt when endAt empty", () => {
    const items: ScheduleItem[] = [
      {
        id: "f2",
        title: "Legacy",
        tag: "design_review",
        startAt: new Date(2026, 4, 2, 15, 0, 0).toISOString(),
        endAt: "",
        status: "finished",
        attendeeCount: 1,
      },
    ];
    const { upcoming, finished } = partitionScheduleForDay(items, anchor);
    expect(finished.map((i) => i.id)).toEqual(["f2"]);
  });

  it("ignores non-finished for finished bucket", () => {
    const items: ScheduleItem[] = [
      {
        id: "x",
        title: "U",
        tag: "brainstorm",
        startAt: new Date(2026, 4, 2, 12, 0, 0).toISOString(),
        endAt: "",
        status: "upcoming",
        attendeeCount: 1,
      },
    ];
    const { finished } = partitionScheduleForDay(items, anchor);
    expect(finished).toEqual([]);
  });
});
