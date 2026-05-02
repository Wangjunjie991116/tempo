import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";
import type { ScheduleItem } from "../repo/types";
import { getScheduleCardTimeSegments } from "../utils/scheduleCardTimeSegments";
import { CalendarDotsIcon } from "./icons/CalendarDotsIcon";

type Props = {
  item: ScheduleItem;
  variant: "upcoming" | "finished";
  onPress: () => void;
};

/** 右侧日程卡片本体（描边与底色）；左侧时间轴见 {@link ScheduleTimelineRail}。 */
export function ScheduleCard({ item, variant, onPress }: Props) {
  const t = useTempoTheme();
  const bg = variant === "finished" ? t.scheduleCardDone : t.scheduleCardUpcoming;
  const borderColor = variant === "finished" ? t.scheduleCardBorderPositive : t.scheduleCardBorderBrand;

  const segments = getScheduleCardTimeSegments(
    item.startAt,
    item.endAt > 0 ? item.endAt : item.startAt,
  );

  return (
    <Pressable
      onPress={onPress}
      android_ripple={
        Platform.OS === "android"
          ? { color: "rgba(21, 21, 21, 0.06)", foreground: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: bg,
          borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.metaRow}>
        <CalendarDotsIcon size={16} color={t.textMeta} />
        <Text style={styles.meta} numberOfLines={2}>
          {segments.map((seg, i) => (
            <Text
              key={`${seg.role}-${i}-${seg.text}`}
              style={{ color: seg.role === "time" ? t.scheduleCardTime : t.textMeta }}
            >
              {seg.text}
            </Text>
          ))}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  meta: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
});
