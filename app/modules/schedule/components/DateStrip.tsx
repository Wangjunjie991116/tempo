import { LinearGradient } from "expo-linear-gradient";
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
import {
  enumerateDaysInclusive,
  indexOfSameDay,
  localDayKey,
  sameLocalDay,
  startOfLocalDay,
  stripCalendarBounds,
} from "../utils/calendarRange";

const CELL_WIDTH = 52;
const CELL_GAP = 8;
const CELL_STRIDE = CELL_WIDTH + CELL_GAP;
const FADE_WIDTH = 44;

/** `#RRGGBB` → 右侧全透明（用于边缘渐变遮罩）。 */
function fadeEdgeColors(solidHex: string): [string, string] {
  if (solidHex.startsWith("#") && solidHex.length === 7) return [solidHex, `${solidHex}00`];
  return [solidHex, "transparent"];
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

  const fadePair = useMemo(() => fadeEdgeColors(t.screenBg), [t.screenBg]);

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
    <View onLayout={onStripLayout} style={styles.stripRoot}>
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
      <LinearGradient
        pointerEvents="none"
        colors={fadePair}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeLeft}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[fadePair[1], fadePair[0]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stripRoot: {
    position: "relative",
  },
  stripContent: {
    paddingVertical: 4,
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
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
