import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AUTH_STACK } from "../../core/navigation/routes";
import type { AuthStackParamList } from "../../core/navigation/types";
import { apiResetPassword } from "../../core/api/client";
import { AuthInput } from "./components/AuthInput";
import { AuthButton } from "./components/AuthButton";
import { PasswordRequirements } from "./components/PasswordRequirements";
import { validatePassword, validateChangePassword } from "./utils/validation";

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof AUTH_STACK.ChangePassword
>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const pwdCheck = validatePassword(password);

  async function handleSubmit() {
    setError(null);
    const err = validateChangePassword(password, confirmPassword);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword("placeholder@email.com", password);
      navigation.navigate(AUTH_STACK.Login);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headline}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previous passwords.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputCard}>
            <View style={styles.inputGroup}>
              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••••••"
              />
              <AuthInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••••••"
              />
              <PasswordRequirements
                items={[
                  "At least 8 characters",
                  "At least 1 number",
                  "Both upper and lower case letters",
                ]}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
            <AuthButton
              title={loading ? "" : "Reset Password"}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading && <ActivityIndicator color="#FFFFFF" />}
            </AuthButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { flexGrow: 1 },
  headline: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 16,
  },
  titleWrap: {
    alignItems: "center",
    gap: 4,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 24,
    lineHeight: 34,
    color: "#151515",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: "#575757",
    textAlign: "center",
    maxWidth: 279,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  inputGroup: { gap: 16 },
  errorText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "#F04438",
    textAlign: "center",
  },
});
