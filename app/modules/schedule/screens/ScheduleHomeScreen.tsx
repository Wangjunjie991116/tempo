import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "../../../core/i18n";
import { SCHEDULE_STACK } from "../../../core/navigation/routes";
import type { ScheduleStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { easeListTransition } from "../../../core/ui/layoutAnimation";
import type { ScheduleItem } from "../repo/types";
import { DateStrip } from "../components/DateStrip";
import { BellIcon } from "../components/icons/BellIcon";
import { ScheduleCard } from "../components/ScheduleCard";
import { ScheduleSectionHeader } from "../components/ScheduleSectionHeader";
import { useScheduleData } from "../hooks/useScheduleData";

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
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay);
  const { upcoming, finished } = useScheduleData(selectedDay);
  const [snackVisible, setSnackVisible] = useState(false);
  const skipFirstListAnim = useRef(true);

  const tagLabel = useCallback(
    (item: ScheduleItem) => {
      if (item.tag === "design_review") return tr("schedule:tagDesignReview");
      if (item.tag === "workshop") return tr("schedule:tagWorkshop");
      return tr("schedule:tagBrainstorm");
    },
    [tr],
  );

  const onCardPress = useCallback(() => {
    setSnackVisible(true);
  }, []);

  const sectionTodayTitle = useMemo(
    () => tr("schedule:sectionToday", { count: upcoming.length }),
    [tr, upcoming.length],
  );
  const sectionFinishedTitle = useMemo(
    () => tr("schedule:sectionFinished", { count: finished.length }),
    [tr, finished.length],
  );

  const selectDay = useCallback((d: Date) => {
    easeListTransition();
    setSelectedDay(d);
  }, []);

  useEffect(() => {
    if (skipFirstListAnim.current) {
      skipFirstListAnim.current = false;
      return;
    }
    easeListTransition();
  }, [upcoming.length, finished.length]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: t.space.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: t.scheduleCardUpcoming }]}>
            <Text style={[styles.avatarLetter, { color: t.brand }]}>G</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.greetingHi, { color: t.textPrimary }]}>
              {tr("schedule:greetingHi", { name: "Gavin" })}
            </Text>
            <Text style={[styles.goodMorning, { color: t.textPrimary }]}>
              {tr("schedule:goodMorning")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("notifications:inboxTitle")}
            onPress={() => navigation.navigate(SCHEDULE_STACK.NotificationInbox)}
            android_ripple={
              Platform.OS === "android"
                ? { color: "rgba(96, 101, 230, 0.14)", borderless: true }
                : undefined
            }
            style={({ pressed }) => [styles.bellBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <BellIcon size={26} color={t.textPrimary} />
          </Pressable>
        </View>

        <View style={{ marginTop: t.space.md }}>
          <DateStrip selected={selectedDay} onSelect={selectDay} />
        </View>

        <View style={{ marginTop: t.space.xl, gap: t.space.md }}>
          <ScheduleSectionHeader title={sectionTodayTitle} dotColor={t.brand} />
          {upcoming.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              tagLabel={tagLabel(item)}
              variant="upcoming"
              onPress={onCardPress}
            />
          ))}
        </View>

        <View style={{ marginTop: t.space.xl, gap: t.space.md }}>
          <ScheduleSectionHeader title={sectionFinishedTitle} dotColor={t.badge.workshop.fg} />
          {finished.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              tagLabel={tagLabel(item)}
              variant="finished"
              onPress={onCardPress}
            />
          ))}
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2200}>
        {tr("schedule:detailSoon")}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
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
