import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTempoTheme } from "../../../core/theme";

const CELL_WIDTH = 52;
const CELL_GAP = 8;
const CELL_STRIDE = CELL_WIDTH + CELL_GAP;

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Jan 1 (year−1) … Dec 31 (year+1)，year = 设备当前公历年（例：2026 → 2025-01-01 … 2027-12-31） */
function stripCalendarBounds(): { min: Date; max: Date } {
  const y = new Date().getFullYear();
  return {
    min: startOfLocalDay(new Date(y - 1, 0, 1)),
    max: startOfLocalDay(new Date(y + 1, 11, 31)),
  };
}

function enumerateDaysInclusive(min: Date, max: Date): Date[] {
  const out: Date[] = [];
  let cur = startOfLocalDay(min);
  const endT = startOfLocalDay(max).getTime();
  while (cur.getTime() <= endT) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function indexOfSameDay(days: Date[], day: Date): number {
  const t = startOfLocalDay(day).getTime();
  return days.findIndex((d) => startOfLocalDay(d).getTime() === t);
}

type Props = {
  selected: Date;
  onSelect: (day: Date) => void;
};

export function DateStrip({ selected, onSelect }: Props) {
  const t = useTempoTheme();
  const listRef = useRef<FlatList<Date>>(null);
  const [stripWidth, setStripWidth] = useState(() => Dimensions.get("window").width);
  const prevCenterKey = useRef<string | null>(null);

  const { min, max } = useMemo(() => stripCalendarBounds(), []);
  const days = useMemo(() => enumerateDaysInclusive(min, max), [min, max]);

  const fmtWeekday = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "short" }),
    [],
  );

  const scrollDayToViewportCenter = useCallback(
    (day: Date, animated: boolean) => {
      if (stripWidth <= 0 || days.length === 0) return;
      const idx = indexOfSameDay(days, day);
      if (idx < 0) return;
      const offset = Math.max(0, idx * CELL_STRIDE - stripWidth / 2 + CELL_WIDTH / 2);
      listRef.current?.scrollToOffset({ offset, animated });
    },
    [days, stripWidth],
  );

  /** 条带宽变化或换曰：把选中曰滚到横向视口中间；首帧无动画 */
  useEffect(() => {
    if (stripWidth <= 0 || days.length === 0) return;
    const key = localDayKey(selected);
    const animated = prevCenterKey.current !== null && prevCenterKey.current !== key;
    requestAnimationFrame(() => {
      scrollDayToViewportCenter(selected, animated);
      prevCenterKey.current = key;
    });
  }, [selected, stripWidth, days.length, scrollDayToViewportCenter]);

  const onStripLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setStripWidth(w);
  }, []);

  const renderItem: ListRenderItem<Date> = useCallback(
    ({ item: d }) => {
      const active = sameLocalDay(d, selected);
      return (
        <Pressable
          onPress={() => onSelect(startOfLocalDay(d))}
          style={({ pressed }) => [
            styles.cell,
            {
              marginRight: CELL_GAP,
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
    },
    [fmtWeekday, onSelect, selected, t.brand, t.scheduleCardUpcoming, t.textMuted, t.textPrimary],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CELL_STRIDE,
      offset: CELL_STRIDE * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback((d: Date) => localDayKey(d), []);

  return (
    <View onLayout={onStripLayout}>
      <FlatList
        ref={listRef}
        horizontal
        data={days}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={31}
        maxToRenderPerBatch={40}
        windowSize={7}
        contentContainerStyle={styles.stripContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stripContent: {
    paddingVertical: 4,
  },
  cell: {
    width: CELL_WIDTH,
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
