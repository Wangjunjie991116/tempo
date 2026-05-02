import { DEFAULT_SCHEDULE_ITEMS } from "../seed";

describe("DEFAULT_SCHEDULE_ITEMS", () => {
  it("has 6 items", () => {
    expect(DEFAULT_SCHEDULE_ITEMS.length).toBe(6);
  });

  it("has 4 upcoming and 2 finished", () => {
    expect(DEFAULT_SCHEDULE_ITEMS.filter((i) => i.status === "upcoming")).toHaveLength(4);
    expect(DEFAULT_SCHEDULE_ITEMS.filter((i) => i.status === "finished")).toHaveLength(2);
  });
});
