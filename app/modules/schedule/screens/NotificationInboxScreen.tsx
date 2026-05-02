import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Fragment, useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Divider,
  List,
  SegmentedButtons,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "../../../core/i18n";
import type { ScheduleStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { easeListTransition } from "../../../core/ui/layoutAnimation";
import { NotificationEmptyState } from "../components/NotificationEmptyState";
import {
  type NotificationSegment,
  useNotificationFeed,
} from "../hooks/useNotificationFeed";

type Nav = NativeStackNavigationProp<ScheduleStackParamList>;

export default function NotificationInboxScreen() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["notifications"]);
  const navigation = useNavigation<Nav>();
  const [segment, setSegment] = useState<NotificationSegment>("activity");
  const items = useNotificationFeed(segment);

  const onSegmentChange = useCallback((v: string) => {
    easeListTransition();
    setSegment(v as NotificationSegment);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: t.screenBg }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={tr("notifications:inboxTitle")}
          titleStyle={styles.appBarTitle}
        />
      </Appbar.Header>

      <View style={[styles.segmentWrap, { paddingHorizontal: t.space.lg }]}>
        <SegmentedButtons
          value={segment}
          onValueChange={onSegmentChange}
          buttons={[
            { value: "activity", label: tr("notifications:segmentActivity") },
            { value: "system", label: tr("notifications:segmentSystem") },
          ]}
        />
      </View>

      {items.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={{ paddingBottom: t.space.xl }}
          showsVerticalScrollIndicator={false}
        >
          <List.Section>
            {items.map((item, index) => (
              <Fragment key={item.id}>
                <List.Item
                  title={item.title}
                  description={item.subtitle}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDesc}
                  titleNumberOfLines={2}
                  descriptionNumberOfLines={3}
                />
                {index < items.length - 1 ? <Divider /> : null}
              </Fragment>
            ))}
          </List.Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  segmentWrap: {
    paddingBottom: 8,
  },
  listScroll: {
    flex: 1,
  },
  appBarTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  listTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  listDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    marginTop: 4,
  },
});
