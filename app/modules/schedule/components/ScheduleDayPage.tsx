import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useTranslation } from "../../../core/i18n";
import { useTempoTheme } from "../../../core/theme";
import { partitionScheduleForDay } from "../repo/schedulePartition";
import type { ScheduleItem } from "../repo/types";
import { ScheduleCard } from "./ScheduleCard";
import { ScheduleSectionHeader } from "./ScheduleSectionHeader";

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

  const tagLabel = useCallback(
    (item: ScheduleItem) => {
      if (item.tag === "design_review") return tr("schedule:tagDesignReview");
      if (item.tag === "workshop") return tr("schedule:tagWorkshop");
      return tr("schedule:tagBrainstorm");
    },
    [tr],
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
        {upcoming.map((item) => (
          <ScheduleCard
            key={item.id}
            item={item}
            tagLabel={tagLabel(item)}
            variant="upcoming"
            onPress={onCardPress}
          />
        ))}
      </View>

      <View style={{ marginTop: t.space.xl, gap: t.space.md }}>
        <ScheduleSectionHeader
          title={sectionFinishedTitle}
          dotColor={t.badge.workshop.fg}
        />
        {finished.map((item) => (
          <ScheduleCard
            key={item.id}
            item={item}
            tagLabel={tagLabel(item)}
            variant="finished"
            onPress={onCardPress}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
  },
});
