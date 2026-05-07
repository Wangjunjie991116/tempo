import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { Toast } from "../../../core/ui";
import { FormField } from "../components/FormField";
import { SaveButton } from "../components/SaveButton";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.ChangePassword>;

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasMixedCase: boolean;
}

function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
}

function RuleItem({
  satisfied,
  label,
}: {
  satisfied: boolean;
  label: string;
}) {
  return (
    <View style={styles.ruleRow}>
      <View
        style={[
          styles.ruleDot,
          satisfied ? styles.ruleDotSatisfied : styles.ruleDotUnsatisfied,
        ]}
      >
        {satisfied && (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color="#FFFFFF"
          />
        )}
      </View>
      <Text
        style={[
          styles.ruleText,
          satisfied ? styles.ruleTextSatisfied : styles.ruleTextUnsatisfied,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * 修改密码页（Change Password）。
 *
 * 包含当前密码、新密码、确认新密码输入，以及密码规则校验列表。
 * 所有规则满足且输入非空后可保存，保存成功后返回上一页。
 */
export default function ChangePasswordScreen({ navigation }: Props) {
  const { t } = useTranslation(["common"]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validation = useMemo(
    () => validatePassword(newPassword),
    [newPassword],
  );

  const allRulesSatisfied = useMemo(
    () => validation.minLength && validation.hasNumber && validation.hasMixedCase,
    [validation],
  );

  const isValid = useMemo(() => {
    if (!currentPassword.trim()) return false;
    if (!newPassword.trim()) return false;
    if (!confirmPassword.trim()) return false;
    return allRulesSatisfied;
  }, [currentPassword, newPassword, confirmPassword, allRulesSatisfied]);

  const handleSave = useCallback(() => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Password changed successfully",
    });
    navigation.goBack();
  }, [newPassword, confirmPassword, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          <FormField
            label="Your password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Your password"
          />
          <FormField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="New password"
          />
          <FormField
            label="Confirm new your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new your password"
          />

          {/* Password Rules */}
          <View style={styles.rulesContainer}>
            <RuleItem
              satisfied={validation.minLength}
              label="At least 8 characters"
            />
            <RuleItem
              satisfied={validation.hasNumber}
              label="At least 1 number"
            />
            <RuleItem
              satisfied={validation.hasMixedCase}
              label="Both upper and lower case letters"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <SaveButton
        title="Save Changes"
        disabled={!isValid}
        onPress={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    color: "#151515",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  rulesContainer: {
    marginTop: 4,
    gap: 8,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ruleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleDotUnsatisfied: {
    backgroundColor: "#E8E8E8",
  },
  ruleDotSatisfied: {
    backgroundColor: "#17B26A",
  },
  ruleText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  ruleTextUnsatisfied: {
    color: "#A5A5A5",
  },
  ruleTextSatisfied: {
    color: "#151515",
  },
});
