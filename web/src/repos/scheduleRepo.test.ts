import { beforeEach, describe, expect, it } from "vitest";
import { listSchedules, saveDraft } from "./scheduleRepo";

describe("scheduleRepo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and lists drafts", () => {
    saveDraft({
      title: "会议",
      start_at: null,
      end_at: null,
      all_day: false,
      confidence: 0,
      notes: null,
    });
    const rows = listSchedules();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("会议");
  });
});
