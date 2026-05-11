import { useMemo, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  type LayoutChangeEvent,
} from "react-native";

import { useTempoTheme } from "../../../core/theme";
import { partitionScheduleForDay } from "../repo/schedulePartition";
import type { ScheduleItem } from "../repo/types";

type Props = {
  day: Date;
  allItems: ScheduleItem[];
  horizontalPadding: number;
  onCardPress: (item: ScheduleItem) => void;
};

/** 每小时行高（px）；44 约为原 56 的 78%，既接近 75% 目标又保证可读性 */
const HOUR_HEIGHT = 44;
/** 时间轴顶部偏移量，避免 00:00 标签被上方裁切 */
const TOP_OFFSET = 12;
/** 一天总高度；含顶部偏移与底部留白，避免 00:00 被上下裁切 */
const DAY_HEIGHT = HOUR_HEIGHT * 24 + TOP_OFFSET + HOUR_HEIGHT / 2;
/** 默认滚动到 7:30 */
const DEFAULT_SCROLL_Y = 7.5 * HOUR_HEIGHT;
/** 左侧时间列宽度 */
const TIME_COL_WIDTH = 50;
/** 日程卡片最小高度 */
const MIN_CARD_HEIGHT = 22;

/** 判断两个日程区间是否直接重叠 */
function intervalsOverlap(
  a: { startMin: number; endMin: number },
  b: { startMin: number; endMin: number },
): boolean {
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

/** 将毫秒戳转为当天分钟数（0–1439） */
function msToDayMinutes(epochMs: number): number {
  const d = new Date(epochMs);
  return d.getHours() * 60 + d.getMinutes();
}

/** tag 映射到语义色 */
function tagColors(tag: ScheduleItem["tag"]) {
  switch (tag) {
    case "design_review":
      return { bg: "#dfe0fa", border: "#6065e6", text: "#6065e6" };
    case "workshop":
      return { bg: "#ecfdf3", border: "#17b26a", text: "#17b26a" };
    case "brainstorm":
      return { bg: "#fef3f2", border: "#f04438", text: "#f04438" };
    default:
      return { bg: "#f5f5f5", border: "#a5a5a5", text: "#151515" };
  }
}

export function ScheduleCompactDayPage({
  day,
  allItems,
  horizontalPadding,
  onCardPress,
}: Props) {
  const t = useTempoTheme();
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledRef = useRef(false);

  const hours = useMemo(() => Array.from({ length: 25 }, (_, i) => i), []);

  const { upcoming, finished } = useMemo(
    () => partitionScheduleForDay(allItems, day),
    [allItems, day],
  );

  const dayItems = useMemo(() => {
    const list = [...upcoming, ...finished];
    return list
      .map((item) => {
        const startMin = msToDayMinutes(item.startAt);
        const endMin =
          item.endAt > 0 ? msToDayMinutes(item.endAt) : startMin + 60;
        // 跨天视为到当日结束
        const effectiveEndMin = endMin < startMin ? 24 * 60 : endMin;
        return { item, startMin, endMin: effectiveEndMin };
      })
      .sort((a, b) => a.startMin - b.startMin);
  }, [upcoming, finished]);

  /** 计算每个日程的垂直位置，并处理水平重叠 */
  const positionedItems = useMemo(() => {
    const results: {
      item: ScheduleItem;
      top: number;
      height: number;
      left: number;
      width: number;
      colors: ReturnType<typeof tagColors>;
    }[] = [];

    const n = dayItems.length;
    const visited = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;

      // BFS 找冲突簇：所有直接或间接时间重叠的日程
      const cluster: number[] = [];
      const queue = [i];
      visited[i] = true;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        cluster.push(curr);

        for (let j = 0; j < n; j++) {
          if (visited[j]) continue;
          const hasOverlap = cluster.some((k) =>
            intervalsOverlap(dayItems[j], dayItems[k]),
          );
          if (hasOverlap) {
            visited[j] = true;
            queue.push(j);
          }
        }
      }

      // 簇内按开始时间排序，贪心分配列
      cluster.sort((a, b) => dayItems[a].startMin - dayItems[b].startMin);
      const columns: number[][] = [];

      for (const idx of cluster) {
        let placed = false;
        for (const col of columns) {
          const lastIdx = col[col.length - 1];
          if (dayItems[idx].startMin >= dayItems[lastIdx].endMin) {
            col.push(idx);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([idx]);
        }
      }

      const colCount = columns.length;
      for (let c = 0; c < colCount; c++) {
        for (const idx of columns[c]) {
          const d = dayItems[idx];
          const top = (d.startMin / 60) * HOUR_HEIGHT;
          const height = Math.max(
            ((d.endMin - d.startMin) / 60) * HOUR_HEIGHT,
            MIN_CARD_HEIGHT,
          );
          results.push({
            item: d.item,
            top,
            height,
            left: (c / colCount) * 100,
            width: 100 / colCount,
            colors: tagColors(d.item.tag),
          });
        }
      }
    }

    return results;
  }, [dayItems]);

  /** 当前时间 */
  const nowMs = Date.now();
  const isToday = useMemo(() => {
    const n = new Date(nowMs);
    return (
      n.getFullYear() === day.getFullYear() &&
      n.getMonth() === day.getMonth() &&
      n.getDate() === day.getDate()
    );
  }, [nowMs, day]);

  const nowMinutes = useMemo(() => {
    const n = new Date(nowMs);
    return n.getHours() * 60 + n.getMinutes();
  }, [nowMs]);

  const nowLineTop = (nowMinutes / 60) * HOUR_HEIGHT;

  const handleLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (hasScrolledRef.current) return;
      hasScrolledRef.current = true;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: DEFAULT_SCROLL_Y,
          animated: false,
        });
      });
    },
    [],
  );

  function formatHour(h: number): string {
    if (h === 24) return "00:00";
    return `${String(h).padStart(2, "0")}:00`;
  }

  return (
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      onLayout={handleLayout}
      contentContainerStyle={{
        paddingHorizontal: horizontalPadding,
        paddingBottom: 32,
      }}
    >
      <View style={[styles.timeline, { height: DAY_HEIGHT }]}>
        {/* 左侧时间刻度 */}
        <View style={[styles.timeRail, { width: TIME_COL_WIDTH }]}>
          {hours.map((h) => (
            <Text
              key={h}
              style={[
                styles.hourLabel,
                { top: h * HOUR_HEIGHT + TOP_OFFSET - 6 },
              ]}
            >
              {formatHour(h)}
            </Text>
          ))}
        </View>

        {/* 右侧内容区 */}
        <View style={styles.contentArea}>
          {/* 小时网格线 */}
          {hours.map((h) => (
            <View
              key={`line-${h}`}
              style={[
                styles.hourLine,
                { top: h * HOUR_HEIGHT + TOP_OFFSET },
              ]}
            />
          ))}

          {/* 当前时间线 */}
          {isToday && (
            <View style={[styles.nowLine, { top: nowLineTop + TOP_OFFSET }]}>
              <View style={styles.nowDot} />
            </View>
          )}

          {/* 日程卡片 */}
          {positionedItems.map((p) => (
            <Pressable
              key={p.item.id}
              onPress={() => onCardPress(p.item)}
              style={[
                styles.scheduleCard,
                {
                  top: p.top + TOP_OFFSET,
                  height: p.height,
                  left: `${p.left}%`,
                  width: `${p.width}%`,
                  backgroundColor: p.colors.bg,
                  borderLeftColor: p.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.cardTitle, { color: p.colors.text }]}
                numberOfLines={1}
              >
                {p.item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeline: {
    flexDirection: "row",
  },
  timeRail: {
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "#e8e8e8",
  },
  hourLabel: {
    position: "absolute",
    right: 8,
    fontSize: 11,
    color: "#a5a5a5",
    fontVariant: ["tabular-nums"],
    lineHeight: 12,
  },
  contentArea: {
    flex: 1,
    position: "relative",
  },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#e8e8e8",
    opacity: 0.6,
  },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f04438",
    zIndex: 10,
  },
  nowDot: {
    position: "absolute",
    left: -4,
    top: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#f04438",
  },
  scheduleCard: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderLeftWidth: 3,
    overflow: "hidden",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
  },
});
