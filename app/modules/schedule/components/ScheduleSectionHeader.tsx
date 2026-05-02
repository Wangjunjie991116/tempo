import { StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";

type Props = {
  title: string;
  dotColor: string;
};

export function ScheduleSectionHeader({ title, dotColor }: Props) {
  const t = useTempoTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text>
      <View style={[styles.line, { backgroundColor: t.divider }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    minWidth: 8,
  },
});
