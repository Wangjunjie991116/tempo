import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AUTH_STACK } from "../../core/navigation/routes";
import type { AuthStackParamList } from "../../core/navigation/types";
import { apiForgotPassword } from "../../core/api/client";
import { AuthInput } from "./components/AuthInput";
import { AuthButton } from "./components/AuthButton";
import { validateForgotPassword } from "./utils/validation";

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof AUTH_STACK.ForgotPassword
>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleSubmit() {
    setError(null);
    const err = validateForgotPassword(email);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      await apiForgotPassword(email);
      navigation.navigate(AUTH_STACK.ChangePassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
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
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Please enter your registered email to send a verification code
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputCard}>
            <View style={styles.inputGroup}>
              <AuthInput
                label="Enter Email"
                value={email}
                onChangeText={setEmail}
                placeholder="jhoncihuy@gmail.com"
                keyboardType="email-address"
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
            <AuthButton
              title={loading ? "" : "Continue"}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading && <ActivityIndicator color="#FFFFFF" />}
            </AuthButton>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <Pressable onPress={() => navigation.navigate(AUTH_STACK.Login)}>
          <Text style={styles.bottomText}>
            Already remember you password?{" "}
            <Text style={styles.bottomTextBold}>Sign In</Text>
          </Text>
        </Pressable>
        <View style={styles.homeIndicator} />
      </View>
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
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
    gap: 8,
  },
  bottomText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: "#575757",
  },
  bottomTextBold: {
    fontFamily: "Manrope_600SemiBold",
    color: "#151515",
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#151515",
    marginTop: 8,
    alignSelf: "center",
  },
});
