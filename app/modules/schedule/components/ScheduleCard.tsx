import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";
import type { ScheduleItem } from "../repo/types";
import { ChevronRightIcon } from "./icons/ChevronRightIcon";
import { ScheduleTagBadge } from "./ScheduleTagBadge";

function formatRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const s = new Date(startIso);
  const e = new Date(endIso);
  const left = new Intl.DateTimeFormat("en-US", opts).format(s);
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${left} · ${timeFmt.format(s)} - ${timeFmt.format(e)}`;
}

type Props = {
  item: ScheduleItem;
  tagLabel: string;
  variant: "upcoming" | "finished";
  onPress: () => void;
};

export function ScheduleCard({ item, tagLabel, variant, onPress }: Props) {
  const t = useTempoTheme();
  const bg = variant === "finished" ? t.scheduleCardDone : t.scheduleCardUpcoming;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: bg,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <ScheduleTagBadge tag={item.tag} label={tagLabel} />
      <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.meta, { color: t.textMuted }]} numberOfLines={2}>
        {formatRange(item.startAt, item.endAt)}
      </Text>
      <View style={styles.footer}>
        <AttendeeStack count={item.attendeeCount} overflow={item.attendeeOverflow} color={t.textMuted} />
        <ChevronRightIcon size={22} color={t.textMuted} />
      </View>
    </Pressable>
  );
}

function AttendeeStack({
  count,
  overflow,
  color,
}: {
  count: number;
  overflow?: number;
  color: string;
}) {
  const shown = Math.min(count, 3);
  return (
    <View style={styles.avatars}>
      {Array.from({ length: shown }).map((_, i) => (
        <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, borderColor: color }]}>
          <View style={styles.avatarInner} />
        </View>
      ))}
      {overflow != null && overflow > 0 ? (
        <Text style={[styles.overflow, { color }]}>+{overflow}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  avatarInner: {
    flex: 1,
    backgroundColor: "#c4c4c4",
  },
  overflow: {
    marginLeft: 8,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
});
