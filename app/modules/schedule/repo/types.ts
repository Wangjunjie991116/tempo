export type ScheduleTag = "design_review" | "workshop" | "brainstorm";

export interface ScheduleItem {
  id: string;
  title: string;
  tag: ScheduleTag;
  /** ISO 8601 */
  startAt: string;
  endAt: string;
  status: "upcoming" | "finished";
  attendeeCount: number;
  attendeeOverflow?: number;
}
