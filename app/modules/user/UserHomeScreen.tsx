import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../core/i18n";
import { useSession } from "../../core/session";
import { USER_STACK } from "../../core/navigation/routes";
import type { UserStackParamList } from "../../core/navigation/types";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.UserHome>;

export default function UserHomeScreen({ navigation }: Props) {
  const { signOut } = useSession();
  const { t } = useTranslation(["common"]);

  return (
    <View style={styles.root}>
      <Text style={styles.headline}>{t("common:userHomeTitle")}</Text>
      <Pressable
        style={styles.row}
        onPress={() => navigation.navigate(USER_STACK.UserWebTest)}
      >
        <Text style={styles.rowLabel}>{t("common:userWebTestRow")}</Text>
        <Text style={styles.rowHint}>{t("common:userWebTestHint")}</Text>
      </Pressable>
      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>{t("common:userSignOutDemo")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f0f2f8",
    marginBottom: 12,
  },
  rowLabel: { fontSize: 16, fontWeight: "500", color: "#1a223d" },
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
