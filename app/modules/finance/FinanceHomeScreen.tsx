import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../core/i18n";
import type { MainStackParamList } from "../../core/navigation/types";
import { useTempoTheme } from "../../core/theme";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function FinanceHomeScreen() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["common"]);
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: t.screenBg }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={tr("common:financeTitle")}
          titleStyle={styles.appBarTitle}
        />
      </Appbar.Header>

      <View style={styles.center}>
        <Text style={[styles.title, { color: t.textPrimary }]}>{tr("common:financeTitle")}</Text>
        <Text style={[styles.sub, { color: t.textMuted }]}>{tr("common:financeSubtitle")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  appBarTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  sub: { fontSize: 14, opacity: 0.55 },
});
