import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useTranslation } from "../../../core/i18n";
import { useTempoTheme } from "../../../core/theme";
import { partitionScheduleForDay } from "../repo/schedulePartition";
import type { ScheduleItem } from "../repo/types";
import { ScheduleCard } from "./ScheduleCard";
import { ScheduleSectionHeader } from "./ScheduleSectionHeader";
import { ScheduleTimelineRail } from "./ScheduleTimelineRail";

type Props = {
  day: Date;
  allItems: ScheduleItem[];
  horizontalPadding: number;
  onCardPress: () => void;
};

export function ScheduleDayPage({
  day,
  allItems,
  horizontalPadding,
  onCardPress,
}: Props) {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["schedule"]);

  const { upcoming, finished } = useMemo(
    () => partitionScheduleForDay(allItems, day),
    [allItems, day],
  );

  const monthShort = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
      }).format(day),
    [day],
  );

  const sectionUpcomingTitle = useMemo(
    () => tr("schedule:sectionUpcoming", { count: upcoming.length }),
    [tr, upcoming.length],
  );
  const sectionFinishedTitle = useMemo(
    () => tr("schedule:sectionFinished", { count: finished.length }),
    [tr, finished.length],
  );

  return (
    <ScrollView
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: horizontalPadding, paddingBottom: 32 },
      ]}
    >
      <View style={{ marginTop: t.space.xl, gap: t.space.md }}>
        <ScheduleSectionHeader
          title={sectionUpcomingTitle}
          dotColor={t.brand}
        />
        {upcoming.length > 0 ? (
          <View style={[styles.timelineRow, { gap: t.space.md }]}>
            <ScheduleTimelineRail variant="upcoming" monthShort={monthShort} />
            <View style={[styles.cardStack, { gap: t.space.md }]}>
              {upcoming.map((item) => (
                <ScheduleCard
                  key={item.id}
                  item={item}
                  variant="upcoming"
                  onPress={onCardPress}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: t.space.xl, gap: t.space.md }}>
        <ScheduleSectionHeader
          title={sectionFinishedTitle}
          dotColor={t.badge.workshop.fg}
        />
        {finished.length > 0 ? (
          <View style={[styles.timelineRow, { gap: t.space.md }]}>
            <ScheduleTimelineRail variant="finished" monthShort={monthShort} />
            <View style={[styles.cardStack, { gap: t.space.md }]}>
              {finished.map((item) => (
                <ScheduleCard
                  key={item.id}
                  item={item}
                  variant="finished"
                  onPress={onCardPress}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  cardStack: {
    flex: 1,
    minWidth: 0,
  },
});
