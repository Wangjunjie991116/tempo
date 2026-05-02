import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "../../../core/i18n";
import { SCHEDULE_STACK } from "../../../core/navigation/routes";
import type { ScheduleStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { easeListTransition } from "../../../core/ui/layoutAnimation";
import { DateStrip } from "../components/DateStrip";
import { BellIcon } from "../components/icons/BellIcon";
import { ScheduleDayPage } from "../components/ScheduleDayPage";
import { useScheduleAllItems } from "../hooks/useScheduleAllItems";
import {
  enumerateDaysInclusive,
  indexOfSameDay,
  localDayKey,
  startOfLocalDay,
  stripCalendarBounds,
} from "../utils/calendarRange";
import {
  getScheduleDayPhase,
  scheduleGreetingI18nKey,
} from "../utils/dayPhaseGreeting";

type ScheduleNav = NativeStackNavigationProp<ScheduleStackParamList>;

function initialSelectedDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ScheduleHomeScreen() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["schedule", "notifications"]);
  const navigation = useNavigation<ScheduleNav>();
  const { width: pageWidth } = useWindowDimensions();

  const days = useMemo(() => {
    const { min, max } = stripCalendarBounds();
    return enumerateDaysInclusive(min, max);
  }, []);

  const initialDay = useMemo(() => initialSelectedDay(), []);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const selectedDayRef = useRef(selectedDay);
  selectedDayRef.current = selectedDay;

  const initialPagerIndex = Math.max(0, indexOfSameDay(days, initialDay));

  const { items } = useScheduleAllItems();
  const [snackVisible, setSnackVisible] = useState(false);
  const pagerRef = useRef<FlatList<Date>>(null);
  /** `initialScrollIndex` 在大列表上偶发失败时，可见页会停在 index 0，与 DateStrip 选中日不一致 → 分区结果为空。*/
  const pagerAlignedRef = useRef(false);

  useEffect(() => {
    if (pageWidth <= 0 || pagerAlignedRef.current) return;
    pagerAlignedRef.current = true;
    const idx = Math.max(0, indexOfSameDay(days, selectedDay));
    requestAnimationFrame(() => {
      pagerRef.current?.scrollToOffset({ offset: idx * pageWidth, animated: false });
    });
  }, [days, pageWidth, selectedDay]);

  const onCardPress = useCallback(() => {
    setSnackVisible(true);
  }, []);

  const scrollPagerToDay = useCallback(
    (d: Date, animated: boolean) => {
      const idx = indexOfSameDay(days, d);
      if (idx < 0 || pageWidth <= 0) return;
      pagerRef.current?.scrollToOffset({ offset: idx * pageWidth, animated });
    },
    [days, pageWidth],
  );

  const selectDayFromStrip = useCallback(
    (d: Date) => {
      easeListTransition();
      const next = startOfLocalDay(d);
      setSelectedDay(next);
      scrollPagerToDay(next, true);
    },
    [scrollPagerToDay],
  );

  const onPagerMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / pageWidth);
      const day = days[i];
      if (!day) return;
      const next = startOfLocalDay(day);
      if (next.getTime() === startOfLocalDay(selectedDayRef.current).getTime()) return;
      easeListTransition();
      setSelectedDay(next);
    },
    [days, pageWidth],
  );

  const keyExtractor = useCallback((d: Date) => localDayKey(d), []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  const renderDayPage: ListRenderItem<Date> = useCallback(
    ({ item }) => (
      <View style={{ width: pageWidth, flex: 1 }}>
        <ScheduleDayPage
          day={item}
          allItems={items}
          horizontalPadding={t.space.lg}
          onCardPress={onCardPress}
        />
      </View>
    ),
    [items, onCardPress, pageWidth, t.space.lg],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.screenBg }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.headerBlock, { paddingHorizontal: t.space.lg }]}>
        <View style={styles.headerRow}>
          <View
            style={[styles.avatar, { backgroundColor: t.scheduleCardUpcoming }]}
          >
            <Text style={[styles.avatarLetter, { color: t.brand }]}>G</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.greetingHi, { color: t.textPrimary }]}>
              {tr("schedule:greetingHi", { name: "Gavin 👋" })}
            </Text>
            <Text style={[styles.goodMorning, { color: t.textPrimary }]}>
              {tr(scheduleGreetingI18nKey(getScheduleDayPhase()))}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("notifications:inboxTitle")}
            onPress={() =>
              navigation.navigate(SCHEDULE_STACK.NotificationInbox)
            }
            android_ripple={
              Platform.OS === "android"
                ? { color: "rgba(96, 101, 230, 0.14)", borderless: true }
                : undefined
            }
            style={({ pressed }) => [
              styles.bellBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <BellIcon size={26} color={t.textPrimary} />
          </Pressable>
        </View>

        <View style={{ marginTop: t.space.md }}>
          <DateStrip selected={selectedDay} onSelect={selectDayFromStrip} />
        </View>
      </View>

      <FlatList
        ref={pagerRef}
        style={styles.pager}
        horizontal
        pagingEnabled
        data={days}
        extraData={items}
        keyExtractor={keyExtractor}
        renderItem={renderDayPage}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialPagerIndex}
        onMomentumScrollEnd={onPagerMomentumEnd}
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => {
            pagerRef.current?.scrollToOffset({
              offset: index * pageWidth,
              animated: false,
            });
          });
        }}
        removeClippedSubviews={false}
      />

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2200}
      >
        {tr("schedule:detailSoon")}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBlock: {
    paddingTop: 16,
  },
  pager: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greetingHi: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  goodMorning: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
  },
  bellBtn: {
    padding: 8,
  },
});
