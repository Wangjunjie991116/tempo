import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTempoTheme } from "../../../core/theme";

function startOfWeekSunday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  selected: Date;
  onSelect: (day: Date) => void;
};

export function DateStrip({ selected, onSelect }: Props) {
  const t = useTempoTheme();
  const days = useMemo(() => {
    const start = startOfWeekSunday(selected);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selected]);

  const fmtWeekday = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "short" }),
    [],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripContent}
    >
      {days.map((d) => {
        const active = sameLocalDay(d, selected);
        return (
          <Pressable
            key={d.toISOString()}
            onPress={() => onSelect(d)}
            style={({ pressed }) => [
              styles.cell,
              {
                borderColor: active ? t.brand : "transparent",
                backgroundColor: active ? t.scheduleCardUpcoming : "transparent",
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={[styles.wd, { color: t.textMuted }]}>{fmtWeekday.format(d)}</Text>
            <Text style={[styles.num, { color: t.textPrimary }]}>{d.getDate()}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stripContent: {
    gap: 8,
    paddingVertical: 4,
  },
  cell: {
    width: 52,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
  },
  wd: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
  },
  num: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
  },
});
