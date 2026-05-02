import type { ScheduleItem } from "../types";
import { SCHEDULE_SEED_EN } from "../seed";
import { mergeWithSeedIfEmpty } from "../scheduleStorage";

describe("mergeWithSeedIfEmpty", () => {
  const seed: ScheduleItem[] = SCHEDULE_SEED_EN;

  it("returns existing when non-empty array", () => {
    const existing: ScheduleItem[] = [
      {
        id: "x",
        title: "X",
        tag: "workshop",
        startAt: "2024-12-01T10:00:00.000Z",
        endAt: "2024-12-01T11:00:00.000Z",
        status: "upcoming",
        attendeeCount: 0,
      },
    ];
    expect(mergeWithSeedIfEmpty(existing, seed)).toEqual(existing);
  });

  it("returns seed when empty array", () => {
    expect(mergeWithSeedIfEmpty([], seed)).toEqual(seed);
  });
});
