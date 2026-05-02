import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../core/i18n";
import { AUTH_STACK } from "../../core/navigation/routes";
import type { AuthStackParamList } from "../../core/navigation/types";
import { useSession } from "../../core/session";

type Props = NativeStackScreenProps<AuthStackParamList, typeof AUTH_STACK.Login>;

export default function LoginScreen(_props: Props) {
  const { signIn } = useSession();
  const { t } = useTranslation(["common"]);
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t("common:loginTitle")}</Text>
      <Pressable style={styles.btn} onPress={signIn}>
        <Text style={styles.btnText}>{t("common:loginEnterApp")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, marginBottom: 16 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#1a223d",
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontSize: 16 },
});
