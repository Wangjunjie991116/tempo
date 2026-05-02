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

/** 一行可见天数 */
const VISIBLE_DAYS = 7;
/** 「今天 / 当前选中」对齐到从左数第几列（1-based 为 4 → 0-based 下标 3） */
const ANCHOR_SLOT_INDEX = 3;
const CELL_GAP = 6;
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
  const prevScrollKey = useRef<string | null>(null);

  const fadePair = useMemo(() => fadeEdgeColors(t.screenBg), [t.screenBg]);

  const { min, max } = useMemo(() => stripCalendarBounds(), []);
  const days = useMemo(() => enumerateDaysInclusive(min, max), [min, max]);

  const fmtWeekday = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "short" }),
    [],
  );

  /** 基于条带宽度均分 7 列（含列间距）。 */
  const { cellWidth, cellStride } = useMemo(() => {
    if (stripWidth <= 0) {
      const cw = 44;
      return { cellWidth: cw, cellStride: cw + CELL_GAP };
    }
    const cw = Math.max(
      30,
      Math.floor((stripWidth - (VISIBLE_DAYS - 1) * CELL_GAP) / VISIBLE_DAYS),
    );
    return { cellWidth: cw, cellStride: cw + CELL_GAP };
  }, [stripWidth]);

  const maxScrollOffset = useMemo(() => {
    const contentW = days.length * cellStride;
    return Math.max(0, contentW - stripWidth);
  }, [days.length, cellStride, stripWidth]);

  const scrollDayToAnchorSlot = useCallback(
    (day: Date, animated: boolean) => {
      if (stripWidth <= 0 || days.length === 0 || cellStride <= 0) return;
      const idx = indexOfSameDay(days, day);
      if (idx < 0) return;
      const raw = (idx - ANCHOR_SLOT_INDEX) * cellStride;
      const offset = Math.max(0, Math.min(raw, maxScrollOffset));
      listRef.current?.scrollToOffset({ offset, animated });
    },
    [days, stripWidth, cellStride, maxScrollOffset],
  );

  /** 条带宽变化或选中曰变化：把「选中曰」锚定到第 4 列（首帧无动画）。 */
  useEffect(() => {
    if (stripWidth <= 0 || days.length === 0) return;
    const key = `${localDayKey(selected)}-${stripWidth}-${cellStride}`;
    const animated = prevScrollKey.current !== null && prevScrollKey.current !== key;
    requestAnimationFrame(() => {
      scrollDayToAnchorSlot(selected, animated);
      prevScrollKey.current = key;
    });
  }, [selected, stripWidth, days.length, cellStride, scrollDayToAnchorSlot]);

  const onStripLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setStripWidth(w);
  }, []);

  const renderItem: ListRenderItem<Date> = useCallback(
    ({ item: d }) => {
      const isSelected = sameLocalDay(d, selected);
      const isToday = sameLocalDay(d, new Date());
      const labelColor = isSelected ? t.textPrimary : t.textMuted;

      /** 今日未选中：文案同非选中，背景为 Brand-selected-highlighted（与卡片 tint 同源 #DFE0FA）。 */
      let backgroundColor: string = "transparent";
      if (isSelected) backgroundColor = t.scheduleCardUpcoming;
      else if (isToday) backgroundColor = t.brandSelectedHighlight;

      return (
        <Pressable
          onPress={() => onSelect(startOfLocalDay(d))}
          style={({ pressed }) => [
            styles.cell,
            {
              width: cellWidth,
              marginRight: CELL_GAP,
              paddingHorizontal: Math.min(8, Math.max(2, Math.floor(cellWidth / 7))),
              borderColor: isSelected ? t.brand : "transparent",
              backgroundColor,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.wd, { color: labelColor }]} numberOfLines={1}>
            {fmtWeekday.format(d)}
          </Text>
          <Text style={[styles.num, { color: labelColor }]}>{d.getDate()}</Text>
        </Pressable>
      );
    },
    [
      cellWidth,
      fmtWeekday,
      onSelect,
      selected,
      t.brand,
      t.brandSelectedHighlight,
      t.scheduleCardUpcoming,
      t.textMuted,
      t.textPrimary,
    ],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: cellStride,
      offset: cellStride * index,
      index,
    }),
    [cellStride],
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
        initialNumToRender={VISIBLE_DAYS + 14}
        maxToRenderPerBatch={40}
        windowSize={7}
        extraData={{ cellWidth, cellStride, selectedKey: localDayKey(selected) }}
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
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  wd: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    maxWidth: "100%",
  },
  num: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
});
