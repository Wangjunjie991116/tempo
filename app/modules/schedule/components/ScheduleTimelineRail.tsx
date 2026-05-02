import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";
import { ScheduleBubbleCheck } from "./icons/ScheduleBubbleCheck";

type Props = {
  variant: "upcoming" | "finished";
  /** 与日期条选中曰一致的月份缩写（如 Dec）。 */
  monthShort: string;
};

/**
 * Figma「日程列表」左侧时间轴：`8142:3182` — 月份、`32×32` 状态圆、`2px` 竖线在 **卡片列外侧**，与卡片间距 16。
 */
export function ScheduleTimelineRail({ variant, monthShort }: Props) {
  const t = useTempoTheme();
  const up = variant === "upcoming";

  return (
    <View style={styles.column}>
      <Text
        style={[
          styles.month,
          {
            color: up ? t.textMuted : t.scheduleRailFinished,
            fontFamily: up ? "Manrope_600SemiBold" : "Manrope_500Medium",
          },
        ]}
      >
        {monthShort}
      </Text>
      <View style={[styles.bubble, { backgroundColor: up ? t.brand : t.scheduleRailFinished }]}>
        {up ? (
          <ActivityIndicator color={t.surfaceElevated} size="small" />
        ) : (
          <ScheduleBubbleCheck size={20} color={t.surfaceElevated} />
        )}
      </View>
      <View style={[styles.verticalLine, { backgroundColor: up ? t.brand : t.scheduleRailFinished }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 32,
    alignItems: "center",
    gap: 4,
    alignSelf: "stretch",
  },
  month: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLine: {
    width: 2,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 8,
    borderRadius: 999,
  },
});
