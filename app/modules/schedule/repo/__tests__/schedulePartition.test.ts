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
        startAt: new Date(2026, 4, 2, 10, 0, 0).getTime(),
        endAt: new Date(2026, 4, 2, 11, 0, 0).getTime(),
        status: "upcoming",
        attendeeCount: 2,
      },
      {
        id: "u2",
        title: "B",
        tag: "brainstorm",
        startAt: new Date(2026, 4, 3, 10, 0, 0).getTime(),
        endAt: new Date(2026, 4, 3, 11, 0, 0).getTime(),
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
        startAt: new Date(2026, 4, 1, 22, 0, 0).getTime(),
        endAt: new Date(2026, 4, 2, 9, 0, 0).getTime(),
        status: "finished",
        attendeeCount: 3,
      },
    ];
    const { upcoming, finished } = partitionScheduleForDay(items, anchor);
    expect(upcoming).toEqual([]);
    expect(finished.map((i) => i.id)).toEqual(["f1"]);
  });

  it("finished falls back to startAt when endAt is zero", () => {
    const items: ScheduleItem[] = [
      {
        id: "f2",
        title: "Legacy",
        tag: "design_review",
        startAt: new Date(2026, 4, 2, 15, 0, 0).getTime(),
        endAt: 0,
        status: "finished",
        attendeeCount: 1,
      },
    ];
    const { finished } = partitionScheduleForDay(items, anchor);
    expect(finished.map((i) => i.id)).toEqual(["f2"]);
  });

  it("ignores non-finished for finished bucket", () => {
    const items: ScheduleItem[] = [
      {
        id: "x",
        title: "U",
        tag: "brainstorm",
        startAt: new Date(2026, 4, 2, 12, 0, 0).getTime(),
        endAt: 0,
        status: "upcoming",
        attendeeCount: 1,
      },
    ];
    const { finished } = partitionScheduleForDay(items, anchor);
    expect(finished).toEqual([]);
  });

  describe("section sorting", () => {
    const base = {
      title: "t",
      tag: "brainstorm" as const,
      attendeeCount: 1,
    };

    it("orders upcoming by startAt ascending", () => {
      const items: ScheduleItem[] = [
        {
          ...base,
          id: "late",
          startAt: new Date(2026, 4, 2, 15, 0).getTime(),
          endAt: new Date(2026, 4, 2, 16, 0).getTime(),
          status: "upcoming",
        },
        {
          ...base,
          id: "early",
          startAt: new Date(2026, 4, 2, 9, 0).getTime(),
          endAt: new Date(2026, 4, 2, 10, 0).getTime(),
          status: "upcoming",
        },
      ];
      const { upcoming } = partitionScheduleForDay(items, anchor);
      expect(upcoming.map((i) => i.id)).toEqual(["early", "late"]);
    });

    it("breaks startAt ties by earlier endAt first", () => {
      const startAt = new Date(2026, 4, 2, 9, 0).getTime();
      const items: ScheduleItem[] = [
        {
          ...base,
          id: "longer",
          startAt,
          endAt: new Date(2026, 4, 2, 11, 0).getTime(),
          status: "upcoming",
        },
        {
          ...base,
          id: "shorter",
          startAt,
          endAt: new Date(2026, 4, 2, 10, 0).getTime(),
          status: "upcoming",
        },
      ];
      const { upcoming } = partitionScheduleForDay(items, anchor);
      expect(upcoming.map((i) => i.id)).toEqual(["shorter", "longer"]);
    });

    it("preserves input order when startAt and endAt both tie (creation order)", () => {
      const startAt = new Date(2026, 4, 2, 9, 0).getTime();
      const endAt = new Date(2026, 4, 2, 10, 0).getTime();
      const items: ScheduleItem[] = [
        { ...base, id: "first", startAt, endAt, status: "upcoming" },
        { ...base, id: "second", startAt, endAt, status: "upcoming" },
        { ...base, id: "third", startAt, endAt, status: "upcoming" },
      ];
      const { upcoming } = partitionScheduleForDay(items, anchor);
      expect(upcoming.map((i) => i.id)).toEqual(["first", "second", "third"]);
    });

    it("treats endAt=0 as equal to startAt for tie-breaking", () => {
      const startAt = new Date(2026, 4, 2, 9, 0).getTime();
      const items: ScheduleItem[] = [
        {
          ...base,
          id: "with-end",
          startAt,
          endAt: new Date(2026, 4, 2, 10, 0).getTime(),
          status: "upcoming",
        },
        { ...base, id: "no-end", startAt, endAt: 0, status: "upcoming" },
      ];
      const { upcoming } = partitionScheduleForDay(items, anchor);
      expect(upcoming.map((i) => i.id)).toEqual(["no-end", "with-end"]);
    });

    it("applies the same ordering to the finished bucket", () => {
      const items: ScheduleItem[] = [
        {
          ...base,
          id: "f-late",
          startAt: new Date(2026, 4, 2, 14, 0).getTime(),
          endAt: new Date(2026, 4, 2, 15, 0).getTime(),
          status: "finished",
        },
        {
          ...base,
          id: "f-early-short",
          startAt: new Date(2026, 4, 2, 9, 0).getTime(),
          endAt: new Date(2026, 4, 2, 9, 30).getTime(),
          status: "finished",
        },
        {
          ...base,
          id: "f-early-long",
          startAt: new Date(2026, 4, 2, 9, 0).getTime(),
          endAt: new Date(2026, 4, 2, 11, 0).getTime(),
          status: "finished",
        },
      ];
      const { finished } = partitionScheduleForDay(items, anchor);
      expect(finished.map((i) => i.id)).toEqual([
        "f-early-short",
        "f-early-long",
        "f-late",
      ]);
    });
  });
});
