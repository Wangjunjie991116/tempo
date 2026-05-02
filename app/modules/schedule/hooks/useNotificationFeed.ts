import { useMemo } from "react";

export type NotificationSegment = "activity" | "system";

export interface NotificationRow {
  id: string;
  title: string;
  subtitle: string;
}

const MOCK_ACTIVITY_EN: NotificationRow[] = [
  {
    id: "n-act-1",
    title: "Design review reminder",
    subtitle: "Project Design Discussion starts in 24 hours.",
  },
  {
    id: "n-act-2",
    title: "Workshop RSVP confirmed",
    subtitle: "You're signed up for Leadership Training 101.",
  },
];

/** System segment empty by default — drives empty-state UI on that tab. */
const MOCK_SYSTEM_EN: NotificationRow[] = [];

export function useNotificationFeed(segment: NotificationSegment): NotificationRow[] {
  return useMemo(
    () => (segment === "activity" ? MOCK_ACTIVITY_EN : MOCK_SYSTEM_EN),
    [segment],
  );
}
