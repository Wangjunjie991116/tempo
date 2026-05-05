import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../core/i18n";
import { USER_STACK } from "../../core/navigation/routes";
import type { UserStackParamList } from "../../core/navigation/types";
import { useSession } from "../../core/session";
import { useTempoTheme } from "../../core/theme";

type Nav = NativeStackNavigationProp<UserStackParamList>;

export default function UserHomeScreen() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["common"]);
  const { signOut } = useSession();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.screenBg }]} edges={["top", "left", "right"]}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: t.screenBg }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={tr("common:userHomeTitle")}
          titleStyle={styles.appBarTitle}
        />
      </Appbar.Header>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Pressable
          style={[styles.row, { backgroundColor: t.brandSelectedHighlight }]}
          onPress={() => navigation.navigate(USER_STACK.UserWebTest)}
        >
          <Text style={[styles.rowLabel, { color: t.textPrimary }]}>{tr("common:userWebTestRow")}</Text>
          <Text style={[styles.rowHint, { color: t.textMuted }]}>{tr("common:userWebTestHint")}</Text>
        </Pressable>
        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>{tr("common:userSignOutDemo")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  appBarTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  rowLabel: { fontSize: 16, fontWeight: "500" },
  rowHint: { fontSize: 13, marginTop: 4, opacity: 0.55 },
  signOut: {
    marginTop: "auto",
    marginBottom: 24,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signOutText: { fontSize: 14, color: "#c00" },
});
