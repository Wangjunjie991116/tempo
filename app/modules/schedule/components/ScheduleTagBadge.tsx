import { StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";
import type { ScheduleTag } from "../repo/types";

type Props = {
  tag: ScheduleTag;
  label: string;
};

export function ScheduleTagBadge({ tag, label }: Props) {
  const t = useTempoTheme();
  const palette =
    tag === "design_review"
      ? t.badge.designReview
      : tag === "workshop"
        ? t.badge.workshop
        : t.badge.brainstorm;

  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 25,
  },
  text: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
  },
});
