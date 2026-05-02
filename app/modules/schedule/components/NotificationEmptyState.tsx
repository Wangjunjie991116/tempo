import Svg, { Circle, Path } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../core/i18n";
import { useTempoTheme } from "../../../core/theme";

/** Lightweight illustration for empty notification lists (SVG-first). */
export function NotificationEmptyState() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["notifications"]);

  return (
    <View style={styles.wrap}>
      <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityElementsHidden>
        <Circle cx={60} cy={60} r={56} fill={t.scheduleCardUpcoming} opacity={0.55} />
        <Path
          fill={t.textMuted}
          opacity={0.35}
          d="M60 28c-8.28 0-15 6.72-15 15v11.2c0 1.65-.54 3.25-1.54 4.56l-2.38 3.17c-.82 1.1-.06 2.67 1.35 2.67h34.14c1.41 0 2.17-1.57 1.35-2.67l-2.38-3.17a7.98 7.98 0 0 1-1.54-4.56V43c0-8.28-6.72-15-15-15Zm-4 82h8c0 4.42-3.58 8-8 8s-8-3.58-8-8Z"
        />
      </Svg>
      <Text style={[styles.title, { color: t.textPrimary }]}>{tr("notifications:emptyTitle")}</Text>
      <Text style={[styles.sub, { color: t.textMuted }]}>{tr("notifications:emptySubtitle")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});
