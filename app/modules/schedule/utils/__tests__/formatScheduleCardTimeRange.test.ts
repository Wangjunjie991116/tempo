import { formatScheduleCardTimeRange } from "../formatScheduleCardTimeRange";

describe("formatScheduleCardTimeRange", () => {
  it("same local day: date once, second segment time only", () => {
    const s = new Date(2026, 4, 2, 12, 15).getTime();
    const e = new Date(2026, 4, 2, 16, 13).getTime();
    expect(formatScheduleCardTimeRange(s, e)).toBe("2026/5/2 12:15 - 16:13");
  });

  it("cross local calendar day: full date on both sides", () => {
    const s = new Date(2026, 4, 2, 12, 15).getTime();
    const e = new Date(2026, 4, 4, 16, 13).getTime();
    expect(formatScheduleCardTimeRange(s, e)).toBe("2026/5/2 12:15 - 2026/5/4 16:13");
  });

  it("pads single-digit hour with zero", () => {
    const s = new Date(2026, 4, 2, 9, 5).getTime();
    const e = new Date(2026, 4, 2, 10, 0).getTime();
    expect(formatScheduleCardTimeRange(s, e)).toBe("2026/5/2 09:05 - 10:00");
  });
});
