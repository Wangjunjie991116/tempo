export type ScheduleDayPhase = "morning" | "afternoon" | "evening";

/**
 * 按设备本地时钟分段问候：**6≤h&lt;12** 早晨；**12≤h&lt;18** 下午；**其余**（含深夜）晚间。
 *
 * @example
 * ```ts
 * getScheduleDayPhase(new Date(2026, 0, 1, 9)); // => "morning"
 * ```
 */
export function getScheduleDayPhase(at: Date = new Date()): ScheduleDayPhase {
  const h = at.getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

/** `schedule:*` 命名空间下的 i18n 键（供 `t(...)` 使用）。 */
export function scheduleGreetingI18nKey(phase: ScheduleDayPhase): string {
  switch (phase) {
    case "morning":
      return "schedule:goodMorning";
    case "afternoon":
      return "schedule:goodAfternoon";
    default:
      return "schedule:goodEvening";
  }
}
