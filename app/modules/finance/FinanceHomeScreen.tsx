import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../core/i18n";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FinanceHomeScreen() {
  const { t } = useTranslation(["common"]);
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.center}>
        <Text style={styles.title}>{t("common:financeTitle")}</Text>
        <Text style={styles.sub}>{t("common:financeSubtitle")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  sub: { fontSize: 14, opacity: 0.55 },
});
